from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from comunidades.models import UsuarioComunidad
from .models import Aviso
from .serializers import AvisoSerializer


class AvisoViewSet(viewsets.ModelViewSet):
    """
    GET /api/avisos/                 -> lista ordenada por fecha (criterio 1)
    GET /api/avisos/<id>/            -> detalle completo (criterio 2)
    Filtros opcionales (criterio 3):
      ?categoria=evento
      ?desde=2026-09-01&hasta=2026-09-30   (formato YYYY-MM-DD)
    POST                         -> administradores y líderes (solo en su comunidad)
    PUT / PATCH                  -> administradores y líderes (solo avisos de su comunidad)
    DELETE                       -> solo administradores (is_staff)
    """
    serializer_class = AvisoSerializer
    queryset = Aviso.objects.all()

    def get_permissions(self):
        # Editar aviso – criterio 3:
        # cualquiera puede consultar; crear/editar/borrar solo administradores (is_staff)
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        # Publicar / editar: requiere sesión; si es líder se valida en perform_create / perform_update
        if self.action in ('create', 'update', 'partial_update'):
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def _ids_lider(self):
        # Comunidades donde el usuario actual es líder (se calcula una vez por petición)
        if not hasattr(self, '_cache_ids_lider'):
            user = self.request.user
            self._cache_ids_lider = set(
                UsuarioComunidad.objects
                .filter(usuario=user, rol=UsuarioComunidad.ROL_LIDER)
                .values_list('comunidad_id', flat=True)
            ) if user.is_authenticated else set()
        return self._cache_ids_lider

    def get_serializer_context(self):
        # Para que el serializer calcule 'puede_editar' sin consultar la BD por cada aviso
        context = super().get_serializer_context()
        user = self.request.user
        context['es_admin'] = user.is_authenticated and user.is_staff
        context['ids_lider'] = self._ids_lider()
        return context

    def perform_update(self, serializer):
        user = self.request.user
        aviso = serializer.instance

        # El administrador edita sin restricciones
        if user.is_staff:
            serializer.save(editado_por=user)
            return

        # Criterio: no puede editar avisos de comunidades donde no es líder, ni avisos de Reúna
        if aviso.comunidad_id is None or aviso.comunidad_id not in self._ids_lider():
            raise PermissionDenied('Solo los líderes de la comunidad del aviso pueden editarlo.')

        # Criterio: la comunidad no se puede cambiar
        nueva = serializer.validated_data.get('comunidad', aviso.comunidad)
        if nueva != aviso.comunidad:
            raise ValidationError({'comunidad': 'La comunidad del aviso no se puede cambiar.'})

        # Criterio: queda registrado quién hizo la última edición (la fecha la pone fecha_edicion)
        serializer.save(editado_por=user)

    def perform_create(self, serializer):
        user = self.request.user

        # El administrador publica sin restricciones (también avisos de plataforma)
        if user.is_staff:
            serializer.save(publicado_por=user)
            return

        # Comunidades donde el usuario es líder
        ids_lider = self._ids_lider()

        # Criterio: un colaborador no puede publicar
        if not ids_lider:
            raise PermissionDenied('Solo los líderes de una comunidad pueden publicar avisos.')

        comunidad = serializer.validated_data.get('comunidad')

        # Criterio: se asocia automáticamente a la comunidad del líder; si es de varias, elige
        if comunidad is None:
            if len(ids_lider) == 1:
                serializer.save(comunidad_id=next(iter(ids_lider)), publicado_por=user)
                return
            raise ValidationError({'comunidad': 'Eres líder en varias comunidades: elige a cuál va el aviso.'})

        # Criterio: no puede publicar en comunidades donde no es líder
        if comunidad.id not in ids_lider:
            raise PermissionDenied('No eres líder de esa comunidad.')

        serializer.save(publicado_por=user)

    def get_queryset(self):
        user = self.request.user
        qs = Aviso.objects.all()

        # Clasificar avisos según comunidad – quién ve qué:
        #   administrador (is_staff) -> todos
        #   usuario con sesión       -> sin comunidad + los de sus comunidades
        #   visitante sin sesión     -> solo los sin comunidad
        # Aplica a la lista Y al detalle (/api/avisos/<id>/ da 404 si no le corresponde)
        if not (user.is_authenticated and user.is_staff):
            visibles = Q(comunidad__isnull=True)
            if user.is_authenticated:
                visibles |= Q(comunidad__usuarios=user)
            qs = qs.filter(visibles).distinct()

        qs = qs.order_by('-fecha_publicacion', '-id')
        params = self.request.query_params

        categoria = params.get('categoria')
        # parse_date devuelve None si el formato no es válido (se ignora el filtro)
        desde = parse_date(params.get('desde') or '')
        hasta = parse_date(params.get('hasta') or '')

        if categoria:
            qs = qs.filter(categoria=categoria)
        if desde:
            qs = qs.filter(fecha_publicacion__gte=desde)
        if hasta:
            qs = qs.filter(fecha_publicacion__lte=hasta)

        return qs
