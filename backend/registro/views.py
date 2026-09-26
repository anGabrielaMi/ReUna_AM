from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer


class PasswordResetRequestView(APIView):
    """Recibe un correo y, si existe una cuenta asociada, envía el enlace de recuperación."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            # DEV: se imprime sin formato de correo para copiar limpio mientras se prueba.
            # El correo "real" (abajo) igual se sigue enviando/mostrando como corresponde.
            if settings.DEBUG:
                print(f"\n[DEV] Link de recuperación: {reset_link}\n")

            send_mail(
                subject='Recupera tu clave de acceso',
                message=(
                    f'Hola {user.username},\n\n'
                    f'Usa este link para definir una nueva clave:\n{reset_link}\n\n'
                    'Si no solicitaste este cambio, puedes ignorar este correo.'
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )

        return Response(
            {'detail': 'Si el correo esta registrado, recibiras instrucciones para recuperar tu clave.'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """Recibe uid + token (del correo) y la nueva contraseña, y la actualiza."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)