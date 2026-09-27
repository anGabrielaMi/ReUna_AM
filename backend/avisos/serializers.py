from rest_framework import serializers
from .models import Aviso


class AvisoSerializer(serializers.ModelSerializer):
    # Nombre legible de la categoría ("Mantención" en vez de "mantencion")
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    # Origen del aviso para mostrar en la app ("Reúna" si es aviso de plataforma)
    comunidad_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Aviso
        read_only_fields = ['fecha_publicacion', 'fecha_edicion']
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'categoria', 'categoria_display', 'fecha_edicion', 'comunidad', 'comunidad_nombre']

    def get_comunidad_nombre(self, obj):
        return obj.comunidad.nombre if obj.comunidad else 'Reúna'
