from django.db import models
from django.contrib.auth.models import User
from comunidades.models import Comunidad


class Aviso(models.Model):
    # Categorías disponibles para filtrar avisos
    CATEGORIAS = [
        ('reunion', 'Reunión'),
        ('evento', 'Evento'),
        ('comunicado', 'Comunicado'),
        ('encuesta', 'Encuesta'),
        ('urgente', 'Urgente'),
        ('general', 'General'),
    ]

    titulo = models.CharField(max_length=200)
    fecha_publicacion = models.DateField(auto_now_add=True)
    # Editar aviso – criterio 2: se actualiza sola en cada guardado
    fecha_edicion = models.DateTimeField(auto_now=True)
    contenido = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default='general')
    # Avisos fijados: aparecen siempre primero en la lista (ej: bienvenida, urgentes).
    # Por ahora solo el administrador los marca, desde el admin de Django
    fijado = models.BooleanField(default=False, help_text='Si está marcado, el aviso aparece primero en la lista.')
    # Clasificar avisos según comunidad:
    #   con comunidad  -> solo lo ven los usuarios adscritos a esa comunidad
    #   sin comunidad  -> aviso de plataforma, visible para todos (incluso sin sesión)
    comunidad = models.ForeignKey(
        Comunidad,
        on_delete=models.CASCADE,   # si se borra la comunidad, se borran sus avisos (no quedan expuestos)
        null=True,
        blank=True,
        related_name='avisos',
    )
    # Editar aviso desde la app (líder): registro de quién publicó y quién editó por última vez
    # (SET_NULL: si se borra el usuario, el aviso se mantiene)
    publicado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='avisos_publicados',
    )
    editado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='avisos_editados',
    )

    class Meta:
        # Fijados primero; luego los más recientes (id desempata avisos del mismo día)
        ordering = ['-fijado', '-fecha_publicacion', '-id']

    def __str__(self):
        return self.titulo
