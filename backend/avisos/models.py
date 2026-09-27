from django.db import models
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

    class Meta:
        # Criterio 1: más recientes primero (id desempata avisos del mismo día)
        ordering = ['-fecha_publicacion', '-id']

    def __str__(self):
        return self.titulo
