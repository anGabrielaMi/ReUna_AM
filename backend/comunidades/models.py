from django.db import models
from django.contrib.auth.models import User  # o tu modelo Usuario si es personalizado


class Comunidad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    # Los miembros se guardan en UsuarioComunidad (tabla intermedia con el rol)
    usuarios = models.ManyToManyField(User, through='UsuarioComunidad', related_name="comunidades")

    def __str__(self):
        return self.nombre


class UsuarioComunidad(models.Model):
    """
    Pertenencia de un usuario a una comunidad (entidad Usuario_Comunidad del modelo E-R).
    El rol es POR comunidad: alguien puede ser líder en una y colaborador en otra.
    El administrador de la plataforma es el is_staff de Django (no va aquí).
    """
    ROL_COLABORADOR = 'colaborador'
    ROL_LIDER = 'lider'
    ROLES = [
        (ROL_COLABORADOR, 'Colaborador'),
        (ROL_LIDER, 'Líder'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='membresias')
    comunidad = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name='membresias')
    rol = models.CharField(max_length=20, choices=ROLES, default=ROL_COLABORADOR)

    class Meta:
        verbose_name = 'miembro'
        verbose_name_plural = 'miembros'
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'comunidad'], name='usuario_unico_por_comunidad'),
        ]

    def __str__(self):
        return f'{self.usuario.username} – {self.comunidad.nombre} ({self.get_rol_display()})'
