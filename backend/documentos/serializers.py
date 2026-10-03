import os

from rest_framework import serializers

from comunidades.models import Comunidad
from .models import Documento, EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_MB


class DocumentoSerializer(serializers.ModelSerializer):
    comunidad_nombre = serializers.CharField(source='comunidad.nombre', read_only=True)
    subido_por_nombre = serializers.CharField(source='subido_por.username', read_only=True, default=None)
    nombre_archivo = serializers.CharField(read_only=True)
    extension = serializers.CharField(read_only=True)
    tamano = serializers.SerializerMethodField()
    # La comunidad es opcional al subir: si el líder es de una sola, se asigna sola
    comunidad = serializers.PrimaryKeyRelatedField(
        queryset=Comunidad.objects.all(),
        required=False, allow_null=True,
    )
    # El archivo se recibe al subir, pero NO se entrega su URL: la descarga pasa
    # por /api/documentos/<id>/descargar/, que revisa que seas miembro de la comunidad
    archivo = serializers.FileField(write_only=True)

    class Meta:
        model = Documento
        fields = ['id', 'titulo', 'archivo', 'nombre_archivo', 'extension', 'tamano',
                  'comunidad', 'comunidad_nombre', 'subido_por_nombre', 'fecha_subida']
        read_only_fields = ['fecha_subida']

    def get_tamano(self, obj):
        # Tamaño en bytes (None si el archivo ya no está en el disco)
        try:
            return obj.archivo.size
        except (FileNotFoundError, ValueError):
            return None

    def validate_titulo(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El título es obligatorio.')
        return value

    def validate_archivo(self, archivo):
        # Subir documento – criterio 2: formatos permitidos
        # (el validador del modelo no lo ejecuta DRF, por eso se revisa aquí)
        extension = os.path.splitext(archivo.name)[1].lstrip('.').lower()
        if extension not in EXTENSIONES_PERMITIDAS:
            raise serializers.ValidationError(
                'Formato no permitido. Usa: ' + ', '.join(EXTENSIONES_PERMITIDAS).upper() + '.'
            )
        # Subir documento – criterio 2: tamaño máximo
        if archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024:
            raise serializers.ValidationError(f'El archivo supera el máximo de {TAMANO_MAXIMO_MB} MB.')
        return archivo
