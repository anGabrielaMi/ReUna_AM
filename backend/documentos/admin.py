from django.contrib import admin

from .models import Documento


# Subir documento – subtarea "Ver y filtrar documentos desde el panel de administración"
@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'comunidad', 'subido_por', 'fecha_subida', 'archivo')
    list_filter = ('comunidad', 'fecha_subida')
    search_fields = ('titulo', 'archivo')
    date_hierarchy = 'fecha_subida'
    empty_value_display = '—'
    readonly_fields = ('subido_por', 'fecha_subida')

    def save_model(self, request, obj, form, change):
        # También queda registro de quién lo subió cuando se hace desde el admin
        if not change:
            obj.subido_por = request.user
        super().save_model(request, obj, form, change)
