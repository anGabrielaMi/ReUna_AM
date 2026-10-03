"""
Datos de prueba para las pruebas automatizadas (Playwright) y demos.

Uso:
    python manage.py seed_demo

Crea (o deja como estaban) usuarios y comunidades de demostración,
y borra los avisos creados por pruebas anteriores (título que empieza con "[Demo]").
Se puede correr las veces que se quiera: el resultado siempre es el mismo.
"""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from avisos.models import Aviso
from comunidades.models import Comunidad, UsuarioComunidad

CLAVE_DEMO = 'demo12345'

COMUNIDADES = ['Demo Los Aromos', 'Demo El Roble']

# usuario -> {comunidad: rol}
USUARIOS = {
    'demo_lider':  {'Demo Los Aromos': 'lider'},
    'demo_colab':  {'Demo Los Aromos': 'colaborador'},
    'demo_multi':  {'Demo Los Aromos': 'lider', 'Demo El Roble': 'lider'},
    'demo_roble':  {'Demo El Roble': 'colaborador'},
}


class Command(BaseCommand):
    help = 'Crea usuarios, comunidades y avisos de demostración para pruebas automatizadas.'

    def handle(self, *args, **options):
        comunidades = {
            nombre: Comunidad.objects.get_or_create(nombre=nombre, defaults={'descripcion': 'Comunidad de prueba'})[0]
            for nombre in COMUNIDADES
        }

        for username, membresias in USUARIOS.items():
            user, _ = User.objects.get_or_create(username=username, defaults={'email': f'{username}@demo.cl'})
            user.set_password(CLAVE_DEMO)
            user.is_staff = False
            user.save()
            # Membresías exactamente como se definen arriba
            UsuarioComunidad.objects.filter(usuario=user).exclude(
                comunidad__nombre__in=membresias.keys()).delete()
            for nombre, rol in membresias.items():
                UsuarioComunidad.objects.update_or_create(
                    usuario=user, comunidad=comunidades[nombre], defaults={'rol': rol})

        # Limpiar avisos de pruebas anteriores
        borrados, _ = Aviso.objects.filter(titulo__startswith='[Demo]').delete()

        # Un aviso base en cada comunidad
        Aviso.objects.create(titulo='[Demo] Bienvenidos a Los Aromos', contenido='Aviso de ejemplo de la comunidad.',
                             categoria='comunicado', comunidad=comunidades['Demo Los Aromos'])
        Aviso.objects.create(titulo='[Demo] Aviso privado de El Roble', contenido='Solo lo ve El Roble.',
                             categoria='comunicado', comunidad=comunidades['Demo El Roble'])

        self.stdout.write(self.style.SUCCESS('Datos de demostración listos.'))
        self.stdout.write(f'  Avisos de prueba anteriores borrados: {borrados}')
        self.stdout.write(f'  Clave de todos los usuarios demo: {CLAVE_DEMO}')
        for username, membresias in USUARIOS.items():
            detalle = ', '.join(f'{rol} en {c}' for c, rol in membresias.items())
            self.stdout.write(f'  - {username}: {detalle}')
