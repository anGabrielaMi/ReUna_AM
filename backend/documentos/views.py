from django.http import FileResponse, Http404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from comunidades.permisos import comunidad_para_publicar, ids_comunidades_miembro
from .models import Documento
from .serializers import DocumentoSerializer


class DocumentoViewSet(viewsets.ModelViewSet):
    """
    GET  /api/documentos/                 -> documentos de mis comunidades (más recientes primero)
         ?comunidad=<id>                  -> solo los de esa comunidad
    GET  /api/documentos/<id>/            -> detalle
    GET  /api/documentos/<id>/descargar/  -> descarga el archivo (solo miembros de la comunidad)
    POST /api/documentos/                 -> subir (multipart: titulo, archivo, comunidad opcional)
                                             solo líderes en su comunidad, o administradores
    PUT / PATCH / DELETE                  -> solo administradores (por ahora)
    """
    serializer_class = DocumentoSerializer
    queryset = Documento.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        # Ver, descargar y subir requieren sesión (subir valida el rol en perform_create)
        if self.action in ('list', 'retrieve', 'descargar', 'create'):
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        qs = Documento.objects.select_related('comunidad', 'subido_por')

        # Consultar documento – criterio 4: solo documentos de mis comunidades.
        # El administrador ve todos. Aplica a lista, detalle y descarga (404 si no le corresponde)
        if not user.is_staff:
            qs = qs.filter(comunidad_id__in=ids_comunidades_miembro(user))

        comunidad = self.request.query_params.get('comunidad')
        if comunidad and comunidad.isdigit():
            qs = qs.filter(comunidad_id=int(comunidad))

        return qs.order_by('-fecha_subida', '-id')

    def perform_create(self, serializer):
        user = self.request.user
        comunidad = serializer.validated_data.pop('comunidad', None)

        if user.is_staff:
            # El administrador puede subir a cualquier comunidad, pero debe indicarla
            if comunidad is None:
                raise ValidationError({'comunidad': 'Indica a qué comunidad va el documento.'})
            serializer.save(comunidad=comunidad, subido_por=user)
            return

        # Subir documento – criterios 1 y 5: solo el líder, y solo en su comunidad
        # (mismo permiso de líder que usan los avisos: comunidades/permisos.py)
        comunidad_id = comunidad_para_publicar(user, comunidad, que='subir documentos')
        serializer.save(comunidad_id=comunidad_id, subido_por=user)

    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        # get_object usa get_queryset: si no eres miembro de la comunidad, responde 404
        documento = self.get_object()
        try:
            archivo = documento.archivo.open('rb')
        except FileNotFoundError:
            raise Http404('El archivo ya no está disponible.')
        return FileResponse(archivo, as_attachment=True, filename=documento.nombre_archivo)
