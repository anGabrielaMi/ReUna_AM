"""
Pruebas de Publicar aviso (permiso de líder).

Correr:  python manage.py test avisos
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from comunidades.models import Comunidad, UsuarioComunidad
from .models import Aviso

URL = '/api/avisos/'
DATOS = {'titulo': 'Reunión', 'contenido': 'El sábado a las 10', 'categoria': 'reunion'}


class PublicarAvisoTests(APITestCase):

    def setUp(self):
        self.aromos = Comunidad.objects.create(nombre='Los Aromos')
        self.robles = Comunidad.objects.create(nombre='Los Robles')
        self.lider = User.objects.create_user('lider', password='clave12345')
        self.colaborador = User.objects.create_user('colab', password='clave12345')
        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.aromos, rol='lider')
        UsuarioComunidad.objects.create(usuario=self.colaborador, comunidad=self.aromos, rol='colaborador')

    def test_lider_publica_y_se_asocia_a_su_comunidad(self):
        self.client.force_authenticate(self.lider)
        r = self.client.post(URL, DATOS)
        self.assertEqual(r.status_code, 201, r.data)
        aviso = Aviso.objects.get()
        self.assertEqual(aviso.comunidad, self.aromos)
        self.assertEqual(aviso.publicado_por, self.lider)

    def test_colaborador_no_puede_publicar(self):
        self.client.force_authenticate(self.colaborador)
        self.assertEqual(self.client.post(URL, DATOS).status_code, 403)

    def test_lider_no_publica_en_otra_comunidad(self):
        self.client.force_authenticate(self.lider)
        r = self.client.post(URL, {**DATOS, 'comunidad': self.robles.id})
        self.assertEqual(r.status_code, 403)

    def test_lider_de_varias_debe_elegir(self):
        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.robles, rol='lider')
        self.client.force_authenticate(self.lider)
        self.assertEqual(self.client.post(URL, DATOS).status_code, 400)
        r = self.client.post(URL, {**DATOS, 'comunidad': self.robles.id})
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(Aviso.objects.get().comunidad, self.robles)
