from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Comunidad

# Registrar Comunidad normalmente
@admin.register(Comunidad)
class ComunidadAdmin(admin.ModelAdmin):
    filter_horizontal = ("usuarios",)

# Extender UserAdmin para mostrar comunidades
class CustomUserAdmin(UserAdmin):
    def mostrar_comunidades(self, obj):
        return ", ".join([c.nombre for c in obj.comunidades.all()])
    mostrar_comunidades.short_description = "Comunidades"

    # Agregar la columna al listado
    list_display = UserAdmin.list_display + ('mostrar_comunidades',)

# Reemplazar el registro por el nuevo admin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
