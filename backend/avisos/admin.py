from django.contrib import admin
from .models import Aviso


@admin.register(Aviso)
class AvisoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'comunidad', 'categoria', 'fecha_publicacion', 'fecha_edicion')
    list_filter = ('comunidad', 'categoria', 'fecha_publicacion')
    empty_value_display = '(Sin comunidad – visible para todos)'
    search_fields = ('titulo', 'contenido')
    # Las fechas las maneja el sistema: se muestran pero no se editan a mano
    readonly_fields = ('fecha_publicacion', 'fecha_edicion')
