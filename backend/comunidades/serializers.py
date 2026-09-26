from rest_framework import serializers
from .models import Comunidad
from django.contrib.auth.models import User

class ComunidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comunidad
        fields = ['id', 'nombre', 'descripcion']

# Nuevo: serializer de registro
class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    # Criterio: correo electrónico obligatorio
    email = serializers.EmailField(required=True, allow_blank=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'Ya existe una cuenta registrada con este correo electrónico.'
            )
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
