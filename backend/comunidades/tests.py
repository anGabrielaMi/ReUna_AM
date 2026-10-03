"""
Pruebas de permisos sobre comunidades.

Correr:  python manage.py test comunidades
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Comunidad, UsuarioComunidad

URL = '/api/comunidades/'


class PermisosComunidadesTests(APITestCase):

    def setUp(self):
        self.comunidad = Comunidad.objects.create(nombre='Los Aromos')
        self.usuario = User.objects.create_user('colab', password='clave12345')
        self.lider = User.objects.create_user('lider', password='clave12345')
        self.admin = User.objects.create_user('admin', password='clave12345', is_staff=True)
        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.comunidad, rol='lider')

    # Seguridad: crear, editar o borrar comunidades es solo del administrador

    def test_usuario_no_puede_crear_comunidad(self):
        self.client.force_authenticate(self.usuario)
        r = self.client.post(URL, {'nombre': 'Nueva'})
        self.assertEqual(r.status_code, 403)

    def test_lider_no_puede_editar_ni_borrar_comunidad(self):
        self.client.force_authenticate(self.lider)
        self.assertEqual(self.client.patch(f'{URL}{self.comunidad.id}/', {'nombre': 'X'}).status_code, 403)
        self.assertEqual(self.client.delete(f'{URL}{self.comunidad.id}/').status_code, 403)
        self.assertTrue(Comunidad.objects.filter(id=self.comunidad.id).exists())

    def test_admin_puede_crear_comunidad(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(URL, {'nombre': 'Nueva'}).status_code, 201)

    def test_sin_sesion_no_ve_comunidades(self):
        self.assertIn(self.client.get(URL).status_code, (401, 403))

    # Lo que sí puede hacer un usuario con sesión

    def test_usuario_ve_lista_y_se_une(self):
        self.client.force_authenticate(self.usuario)
        self.assertEqual(self.client.get(URL).status_code, 200)
        self.assertEqual(self.client.post(f'{URL}{self.comunidad.id}/unirse/').status_code, 200)
        membresia = UsuarioComunidad.objects.get(usuario=self.usuario, comunidad=self.comunidad)
        self.assertEqual(membresia.rol, 'colaborador')   # al unirse queda como colaborador

    def test_mias_devuelve_rol(self):
        self.client.force_authenticate(self.lider)
        r = self.client.get(f'{URL}mias/')
        self.assertEqual(r.data, [{'id': self.comunidad.id, 'nombre': 'Los Aromos', 'rol': 'lider'}])
