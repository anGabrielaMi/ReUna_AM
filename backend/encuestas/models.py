"""
Encuestas (entidades Encuesta, Pregunta y Respuesta del modelo E-R).

Crear encuesta: el líder crea una encuesta en su comunidad, con 1 a 5 preguntas
de opción única y 2 a 5 alternativas cada una, y una fecha de cierre.

Responder encuesta: las respuestas son ANÓNIMAS. Por eso se guardan en dos tablas
separadas que no se conectan entre sí:
  - Participacion: QUIÉN respondió (solo para que nadie responda dos veces).
  - Respuesta:     QUÉ se respondió (sin usuario).
Así nadie, ni siquiera el líder o el administrador, puede saber qué eligió cada persona.
"""
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from comunidades.models import Comunidad

# Crear encuesta – criterios 1 y 2
MIN_PREGUNTAS, MAX_PREGUNTAS = 1, 5
MIN_ALTERNATIVAS, MAX_ALTERNATIVAS = 2, 5


class Encuesta(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    comunidad = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name='encuestas')
    creada_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='encuestas_creadas',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField()

    class Meta:
        ordering = ['-fecha_creacion', '-id']

    def __str__(self):
        return self.titulo

    @property
    def abierta(self):
        # Responder encuesta – criterio 4: después de la fecha de cierre no se responde
        return timezone.now() < self.fecha_cierre

    @property
    def tiene_respuestas(self):
        # Crear encuesta – criterio 5: no se edita si alguien ya respondió
        return self.participaciones.exists()


class Pregunta(models.Model):
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='preguntas')
    texto = models.CharField(max_length=300)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['orden', 'id']

    def __str__(self):
        return self.texto


class Alternativa(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='alternativas')
    texto = models.CharField(max_length=200)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['orden', 'id']

    def __str__(self):
        return self.texto


class Participacion(models.Model):
    """Quién respondió una encuesta (NO guarda qué respondió)."""
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='participaciones')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='participaciones')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'participación'
        verbose_name_plural = 'participaciones'
        # Responder encuesta – criterio 3: cada usuario responde una sola vez
        constraints = [
            models.UniqueConstraint(fields=['encuesta', 'usuario'], name='una_participacion_por_usuario'),
        ]

    def __str__(self):
        return f'{self.usuario.username} respondió "{self.encuesta.titulo}"'


class Respuesta(models.Model):
    """Una alternativa elegida (anónima: no tiene usuario)."""
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='respuestas')
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='respuestas')
    alternativa = models.ForeignKey(Alternativa, on_delete=models.CASCADE, related_name='respuestas')

    def __str__(self):
        return f'{self.pregunta.texto} → {self.alternativa.texto}'
