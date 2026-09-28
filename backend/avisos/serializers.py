from rest_framework import serializers
from .models import Aviso


class AvisoSerializer(serializers.ModelSerializer):
    # Nombre legible de la categoría ("Mantención" en vez de "mantencion")
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    # Origen del aviso para mostrar en la app ("Reúna" si es aviso de plataforma)
    comunidad_nombre = serializers.SerializerMethodField()
    # Editar aviso desde la app (líder)
    publicado_por_nombre = serializers.CharField(source='publicado_por.username', read_only=True, default=None)
    editado_por_nombre = serializers.CharField(source='editado_por.username', read_only=True, default=None)
    puede_editar = serializers.SerializerMethodField()

    class Meta:
        model = Aviso
        # 'fijado' solo se cambia desde el admin de Django (un líder no puede fijar vía API)
        read_only_fields = ['fecha_publicacion', 'fecha_edicion', 'publicado_por', 'editado_por', 'fijado']
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'categoria', 'categoria_display', 'fecha_edicion', 'comunidad', 'comunidad_nombre',
                  'publicado_por_nombre', 'editado_por_nombre', 'puede_editar', 'fijado']

    def get_comunidad_nombre(self, obj):
        return obj.comunidad.nombre if obj.comunidad else 'Reúna'

    def get_puede_editar(self, obj):
        # La app lo usa para mostrar u ocultar el botón "Editar".
        # 'ids_lider' lo calcula la vista una sola vez por petición (ver get_serializer_context)
        if self.context.get('es_admin'):
            return True
        return obj.comunidad_id is not None and obj.comunidad_id in self.context.get('ids_lider', set())
