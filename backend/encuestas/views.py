from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from comunidades.permisos import comunidad_para_publicar, ids_comunidades_lider, ids_comunidades_miembro
from .models import Encuesta, Participacion, Respuesta
from .serializers import EncuestaSerializer, ResponderSerializer


class EncuestaViewSet(viewsets.ModelViewSet):
    """
    GET  /api/encuestas/                   -> encuestas de mis comunidades (más recientes primero)
         ?comunidad=<id>  ?estado=abiertas|cerradas
    GET  /api/encuestas/<id>/              -> detalle con preguntas y alternativas
    POST /api/encuestas/                   -> crear (líder en su comunidad, o administrador)
    PUT / PATCH /api/encuestas/<id>/       -> editar (líder de esa comunidad), solo si nadie respondió
    DELETE /api/encuestas/<id>/            -> solo administrador
    POST /api/encuestas/<id>/responder/    -> responder (miembros de la comunidad, una vez, antes del cierre)
    """
    serializer_class = EncuestaSerializer
    queryset = Encuesta.objects.all()

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminUser()]
        return [IsAuthenticated()]

    # ---------- datos de la petición (se calculan una vez) ----------
    def _ids_lider(self):
        if not hasattr(self, '_cache_ids_lider'):
            self._cache_ids_lider = ids_comunidades_lider(self.request.user)
        return self._cache_ids_lider

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated:
            context['es_admin'] = user.is_staff
            context['ids_lider'] = self._ids_lider()
            context['ids_respondidas'] = set(
                Participacion.objects.filter(usuario=user).values_list('encuesta_id', flat=True)
            )
            context['ids_con_respuestas'] = set(
                Participacion.objects.values_list('encuesta_id', flat=True).distinct()
            )
        return context

    def get_queryset(self):
        user = self.request.user
        qs = (Encuesta.objects
              .select_related('comunidad', 'creada_por')
              .prefetch_related('preguntas__alternativas'))

        # Solo encuestas de mis comunidades (el administrador ve todas).
        # Aplica a lista, detalle, editar y responder: si no le corresponde, 404
        if not user.is_staff:
            qs = qs.filter(comunidad_id__in=ids_comunidades_miembro(user))

        params = self.request.query_params
        comunidad = params.get('comunidad')
        if comunidad and comunidad.isdigit():
            qs = qs.filter(comunidad_id=int(comunidad))

        estado = params.get('estado')
        if estado == 'abiertas':
            qs = qs.filter(fecha_cierre__gt=timezone.now())
        elif estado == 'cerradas':
            qs = qs.filter(fecha_cierre__lte=timezone.now())

        return qs.order_by('-fecha_creacion', '-id')

    # ---------- Crear encuesta ----------
    def perform_create(self, serializer):
        user = self.request.user
        comunidad = serializer.validated_data.pop('comunidad', None)

        if user.is_staff:
            if comunidad is None:
                raise ValidationError({'comunidad': 'Indica a qué comunidad va la encuesta.'})
            serializer.save(comunidad=comunidad, creada_por=user)
            return

        # Criterios 4 y 6: se asocia a la comunidad del líder (si es de varias, elige);
        # un colaborador o un líder de otra comunidad no puede crear (403)
        comunidad_id = comunidad_para_publicar(user, comunidad, ids_lider=self._ids_lider(),
                                               que='crear encuestas')
        serializer.save(comunidad_id=comunidad_id, creada_por=user)

    # ---------- Editar encuesta ----------
    def perform_update(self, serializer):
        user = self.request.user
        encuesta = serializer.instance

        if not user.is_staff and encuesta.comunidad_id not in self._ids_lider():
            raise PermissionDenied('Solo los líderes de la comunidad de esta encuesta pueden editarla.')

        # Criterio 5: no se puede editar si alguien ya respondió
        if encuesta.tiene_respuestas:
            raise ValidationError({'detail': 'La encuesta ya tiene respuestas y no se puede editar.'})

        serializer.save()

    # ---------- Responder encuesta ----------
    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        # get_object usa get_queryset: si no eres miembro de la comunidad, responde 404
        encuesta = self.get_object()

        # Criterio 4: no se responde después del cierre
        if not encuesta.abierta:
            return Response({'detail': 'La encuesta ya cerró.'}, status=status.HTTP_400_BAD_REQUEST)

        # Criterio 3: una sola vez por usuario
        if Participacion.objects.filter(encuesta=encuesta, usuario=request.user).exists():
            return Response({'detail': 'Ya respondiste esta encuesta.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResponderSerializer(data=request.data, context={'encuesta': encuesta})
        serializer.is_valid(raise_exception=True)
        elegidas = serializer.validated_data['respuestas']   # {pregunta_id: alternativa_id}

        try:
            with transaction.atomic():
                # Quién respondió (para la regla de "una vez") ...
                Participacion.objects.create(encuesta=encuesta, usuario=request.user)
                # ... y qué se respondió, SIN usuario (criterio 6: anónimo)
                Respuesta.objects.bulk_create([
                    Respuesta(encuesta=encuesta, pregunta_id=p, alternativa_id=a)
                    for p, a in elegidas.items()
                ])
        except IntegrityError:
            # Dos envíos al mismo tiempo: la base de datos deja pasar solo uno
            return Response({'detail': 'Ya respondiste esta encuesta.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': '¡Gracias! Tu respuesta fue registrada.'}, status=status.HTTP_201_CREATED)
