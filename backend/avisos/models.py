from django.db import models

from django.db import models

class Aviso(models.Model):
    titulo = models.CharField(max_length=200)
    fecha_publicacion = models.DateField(auto_now_add=True)
    contenido = models.TextField()

    def __str__(self):
        return self.titulo

