from django.apps import AppConfig


class ComunidadesConfig(AppConfig):
    # Igual que en avisos: evita que Django pida una migración extra por el tipo de id
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'comunidades'
