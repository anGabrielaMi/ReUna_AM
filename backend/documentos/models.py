import os

from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.db import models

from comunidades.models import Comunidad

# Subir documento – criterio 2: formatos y tamaño permitidos
EXTENSIONES_PERMITIDAS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
TAMANO_MAXIMO_MB = 10


def ruta_documento(instance, filename):
    # media/documentos/<id comunidad>/<archivo>  (Django agrega un sufijo si el nombre se repite)
    return f'documentos/{instance.comunidad_id}/{filename}'


class Documento(models.Model):
    """Documento que un líder sube a su comunidad (entidad Documento del modelo E-R)."""

    titulo = models.CharField(max_length=200)
    archivo = models.FileField(
        upload_to=ruta_documento,
        validators=[FileExtensionValidator(allowed_extensions=EXTENSIONES_PERMITIDAS)],
    )
    # Un documento siempre pertenece a una comunidad (no hay documentos "de Reúna")
    comunidad = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name='documentos')
    # Subir documento – criterio 4: queda registrado quién lo subió y cuándo
    subido_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_subidos',
    )
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Consultar documento – criterio 1: los más recientes primero
        ordering = ['-fecha_subida', '-id']

    def __str__(self):
        return self.titulo

    @property
    def nombre_archivo(self):
        return os.path.basename(self.archivo.name) if self.archivo else ''

    @property
    def extension(self):
        return os.path.splitext(self.archivo.name)[1].lstrip('.').lower() if self.archivo else ''
