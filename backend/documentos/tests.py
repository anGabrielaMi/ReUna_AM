"""
Pruebas de Subir documento y Consultar documento.

Correr:  python manage.py test documentos
"""
import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from comunidades.models import Comunidad, UsuarioComunidad
from .models import Documento

MEDIA_PRUEBAS = tempfile.mkdtemp()
URL = '/api/documentos/'


def pdf(nombre='acta.pdf', contenido=b'%PDF-1.4 prueba'):
    return SimpleUploadedFile(nombre, contenido, content_type='application/pdf')


@override_settings(MEDIA_ROOT=MEDIA_PRUEBAS)
class DocumentosTests(APITestCase):

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_PRUEBAS, ignore_errors=True)

    def setUp(self):
        self.aromos = Comunidad.objects.create(nombre='Los Aromos')
        self.robles = Comunidad.objects.create(nombre='Los Robles')

        self.lider = User.objects.create_user('lider', password='clave12345')
        self.colaborador = User.objects.create_user('colab', password='clave12345')
        self.lider_robles = User.objects.create_user('lider_robles', password='clave12345')
        self.externo = User.objects.create_user('externo', password='clave12345')
        self.admin = User.objects.create_user('admin', password='clave12345', is_staff=True)

        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.aromos, rol='lider')
        UsuarioComunidad.objects.create(usuario=self.colaborador, comunidad=self.aromos, rol='colaborador')
        UsuarioComunidad.objects.create(usuario=self.lider_robles, comunidad=self.robles, rol='lider')

    def subir(self, usuario, **datos):
        self.client.force_authenticate(usuario)
        datos.setdefault('titulo', 'Acta de reunión')
        datos.setdefault('archivo', pdf())
        return self.client.post(URL, datos, format='multipart')

    # ---------------- Subir documento ----------------

    def test_lider_sube_documento_a_su_comunidad(self):
        r = self.subir(self.lider)
        self.assertEqual(r.status_code, 201, r.data)
        doc = Documento.objects.get()
        # Criterio 4: queda registrado quién, dónde y cuándo
        self.assertEqual(doc.comunidad, self.aromos)       # asignada sola (es líder de una)
        self.assertEqual(doc.subido_por, self.lider)
        self.assertIsNotNone(doc.fecha_subida)
        self.assertNotIn('archivo', r.data)                 # no se expone la ruta del archivo

    def test_colaborador_no_puede_subir(self):
        r = self.subir(self.colaborador)
        self.assertEqual(r.status_code, 403)
        self.assertFalse(Documento.objects.exists())

    def test_lider_no_puede_subir_a_otra_comunidad(self):
        r = self.subir(self.lider, comunidad=self.robles.id)
        self.assertEqual(r.status_code, 403)

    def test_sin_sesion_no_puede_subir(self):
        r = self.client.post(URL, {'titulo': 'x', 'archivo': pdf()}, format='multipart')
        self.assertIn(r.status_code, (401, 403))  # 403 por SessionAuthentication

    def test_lider_de_varias_debe_elegir_comunidad(self):
        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.robles, rol='lider')
        r = self.subir(self.lider)
        self.assertEqual(r.status_code, 400)
        self.assertIn('comunidad', r.data)
        r = self.subir(self.lider, comunidad=self.robles.id)
        self.assertEqual(r.status_code, 201, r.data)

    def test_formato_no_permitido(self):
        exe = SimpleUploadedFile('virus.exe', b'MZ...', content_type='application/octet-stream')
        r = self.subir(self.lider, archivo=exe)
        self.assertEqual(r.status_code, 400)
        self.assertIn('archivo', r.data)

    def test_archivo_demasiado_grande(self):
        grande = pdf(contenido=b'0' * (10 * 1024 * 1024 + 1))
        r = self.subir(self.lider, archivo=grande)
        self.assertEqual(r.status_code, 400)
        self.assertIn('archivo', r.data)

    def test_titulo_obligatorio(self):
        r = self.subir(self.lider, titulo='   ')
        self.assertEqual(r.status_code, 400)
        self.assertIn('titulo', r.data)

    # ---------------- Consultar documento ----------------

    def crear_docs(self):
        self.subir(self.lider, titulo='Doc Aromos')
        self.subir(self.lider_robles, titulo='Doc Robles')
        self.client.force_authenticate(None)

    def titulos(self, usuario):
        self.client.force_authenticate(usuario)
        return [d['titulo'] for d in self.client.get(URL).data]

    def test_miembro_ve_solo_documentos_de_sus_comunidades(self):
        self.crear_docs()
        self.assertEqual(self.titulos(self.colaborador), ['Doc Aromos'])
        self.assertEqual(self.titulos(self.lider_robles), ['Doc Robles'])
        self.assertEqual(self.titulos(self.externo), [])

    def test_admin_ve_todos(self):
        self.crear_docs()
        self.assertCountEqual(self.titulos(self.admin), ['Doc Aromos', 'Doc Robles'])

    def test_mas_recientes_primero(self):
        self.subir(self.lider, titulo='Primero')
        self.subir(self.lider, titulo='Segundo')
        self.assertEqual(self.titulos(self.colaborador), ['Segundo', 'Primero'])

    def test_lista_muestra_datos_del_documento(self):
        self.subir(self.lider)
        self.client.force_authenticate(self.colaborador)
        d = self.client.get(URL).data[0]
        self.assertEqual(d['comunidad_nombre'], 'Los Aromos')
        self.assertEqual(d['subido_por_nombre'], 'lider')
        self.assertEqual(d['extension'], 'pdf')
        self.assertIn('fecha_subida', d)

    def test_sin_sesion_no_ve_documentos(self):
        self.crear_docs()
        self.assertIn(self.client.get(URL).status_code, (401, 403))

    def test_miembro_descarga_documento(self):
        self.subir(self.lider)
        doc = Documento.objects.get()
        self.client.force_authenticate(self.colaborador)
        r = self.client.get(f'{URL}{doc.id}/descargar/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(b''.join(r.streaming_content), b'%PDF-1.4 prueba')
        self.assertIn('attachment', r['Content-Disposition'])

    def test_no_miembro_no_puede_descargar(self):
        self.subir(self.lider)
        doc = Documento.objects.get()
        self.client.force_authenticate(self.lider_robles)
        r = self.client.get(f'{URL}{doc.id}/descargar/')
        self.assertEqual(r.status_code, 404)

    def test_colaborador_no_puede_borrar(self):
        self.subir(self.lider)
        doc = Documento.objects.get()
        self.client.force_authenticate(self.lider)
        self.assertEqual(self.client.delete(f'{URL}{doc.id}/').status_code, 403)
