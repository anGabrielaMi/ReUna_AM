from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Comunidad, UsuarioComunidad


# Publicar aviso – asignar rol: al editar una comunidad se ven sus miembros con su rol
class MiembroInline(admin.TabularInline):
    model = UsuarioComunidad
    extra = 1
    autocomplete_fields = ('usuario',)
    fields = ('usuario', 'rol')


@admin.register(Comunidad)
class ComunidadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'total_miembros', 'lideres')
    search_fields = ('nombre',)
    inlines = [MiembroInline]

    def total_miembros(self, obj):
        return obj.membresias.count()
    total_miembros.short_description = 'Miembros'

    def lideres(self, obj):
        return ", ".join(m.usuario.username for m in obj.membresias.filter(rol=UsuarioComunidad.ROL_LIDER))
    lideres.short_description = 'Líderes'


# Extender UserAdmin para mostrar comunidades (con el rol en cada una)
class CustomUserAdmin(UserAdmin):
    def mostrar_comunidades(self, obj):
        return ", ".join(
            f"{m.comunidad.nombre} ({m.get_rol_display()})" for m in obj.membresias.select_related('comunidad')
        )
    mostrar_comunidades.short_description = "Comunidades"

    # Agregar la columna al listado
    list_display = UserAdmin.list_display + ('mostrar_comunidades',)


# Reemplazar el registro por el nuevo admin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
