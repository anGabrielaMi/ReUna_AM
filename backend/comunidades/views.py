from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Comunidad, UsuarioComunidad
from .serializers import ComunidadSerializer, RegistroSerializer
from django.contrib.auth.models import User

class ComunidadViewSet(viewsets.ModelViewSet):
    queryset = Comunidad.objects.all()
    serializer_class = ComunidadSerializer

    def get_permissions(self):
        # Seguridad: crear, editar o borrar comunidades es solo del administrador (is_staff).
        # Ver la lista, ver "mias", unirse y salir solo requiere sesión.
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    # Publicar aviso: GET /api/comunidades/mias/ -> comunidades del usuario con su rol
    # La app lo usa para saber si es líder (mostrar "Publicar aviso") y en qué comunidades
    @action(detail=False, methods=['get'])
    def mias(self, request):
        membresias = (UsuarioComunidad.objects
                      .filter(usuario=request.user)
                      .select_related('comunidad')
                      .order_by('comunidad__nombre'))
        return Response([
            {'id': m.comunidad.id, 'nombre': m.comunidad.nombre, 'rol': m.rol}
            for m in membresias
        ])

    @action(detail=True, methods=['post'])
    def unirse(self, request, pk=None):
        comunidad = self.get_object()
        usuario = request.user
        comunidad.usuarios.add(usuario)
        return Response({'status': f'{usuario.username} se unió a {comunidad.nombre}'})

    @action(detail=True, methods=['post'])
    def salir(self, request, pk=None):
        comunidad = self.get_object()
        usuario = request.user
        comunidad.usuarios.remove(usuario)
        return Response({'status': f'{usuario.username} salió de {comunidad.nombre}'})

# Nuevo: vista de registro
class RegistroView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]
