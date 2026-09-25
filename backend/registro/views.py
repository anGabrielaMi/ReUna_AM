from rest_framework import generics, permissions
from django.contrib.auth.models import User
from .serializers import RegistroSerializer

class RegistroView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]
