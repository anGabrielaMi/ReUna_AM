from django.contrib import admin

from .models import Alternativa, Encuesta, Participacion, Pregunta


class AlternativaInline(admin.TabularInline):
    model = Alternativa
    extra = 0


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('texto', 'encuesta', 'orden')
    list_filter = ('encuesta__comunidad',)
    inlines = [AlternativaInline]


class PreguntaInline(admin.TabularInline):
    model = Pregunta
    extra = 0
    show_change_link = True   # para abrir la pregunta y ver sus alternativas


@admin.register(Encuesta)
class EncuestaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'comunidad', 'creada_por', 'fecha_creacion', 'fecha_cierre', 'esta_abierta',
                    'participantes')
    list_filter = ('comunidad', 'fecha_cierre')
    search_fields = ('titulo',)
    readonly_fields = ('creada_por', 'fecha_creacion')
    inlines = [PreguntaInline]

    @admin.display(boolean=True, description='Abierta')
    def esta_abierta(self, obj):
        return obj.abierta

    @admin.display(description='Respondieron')
    def participantes(self, obj):
        return obj.participaciones.count()

    def save_model(self, request, obj, form, change):
        if not change:
            obj.creada_por = request.user
        super().save_model(request, obj, form, change)


# Solo QUIÉN respondió (no qué). Las respuestas en sí no se muestran por usuario: son anónimas.
@admin.register(Participacion)
class ParticipacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'encuesta', 'fecha')
    list_filter = ('encuesta__comunidad', 'encuesta')
    readonly_fields = ('usuario', 'encuesta', 'fecha')

    def has_add_permission(self, request):
        return False
