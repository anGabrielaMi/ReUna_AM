from django.db import models
from django.contrib.auth.models import User  # o tu modelo Usuario si es personalizado

class Comunidad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    usuarios = models.ManyToManyField(User, related_name="comunidades")

    def __str__(self):
        return self.nombre
