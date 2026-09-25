from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Comunidad
from .serializers import ComunidadSerializer, RegistroSerializer
from django.contrib.auth.models import User

class ComunidadViewSet(viewsets.ModelViewSet):
    queryset = Comunidad.objects.all()
    serializer_class = ComunidadSerializer
    permission_classes = [permissions.IsAuthenticated]

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
