from django.contrib import admin
from .models import Aviso


@admin.register(Aviso)
class AvisoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fijado', 'comunidad_o_reuna', 'categoria', 'fecha_publicacion', 'publicado_por',
                    'fecha_edicion', 'editado_por')
    list_filter = ('fijado', 'comunidad', 'categoria', 'fecha_publicacion')
    # Fijar/desfijar directo desde la lista, sin abrir cada aviso
    list_editable = ('fijado',)
    empty_value_display = '—'
    search_fields = ('titulo', 'contenido')
    # Las fechas y autores los maneja el sistema: se muestran pero no se editan a mano
    readonly_fields = ('fecha_publicacion', 'publicado_por', 'fecha_edicion', 'editado_por')

    @admin.display(description='Comunidad', ordering='comunidad__nombre')
    def comunidad_o_reuna(self, obj):
        return obj.comunidad.nombre if obj.comunidad else '(Sin comunidad – visible para todos)'

    def save_model(self, request, obj, form, change):
        # También queda registro cuando se publica o edita desde el admin de Django
        if change:
            obj.editado_por = request.user
        else:
            obj.publicado_por = request.user
        super().save_model(request, obj, form, change)
