"""
Pruebas de Crear encuesta y Responder encuesta.

Correr:  python manage.py test encuestas
"""
from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase

from comunidades.models import Comunidad, UsuarioComunidad
from .models import Encuesta, Participacion, Respuesta

URL = '/api/encuestas/'


def manana():
    return (timezone.now() + timedelta(days=1)).isoformat()


def datos_encuesta(**extra):
    datos = {
        'titulo': '¿Cambiamos el horario de reunión?',
        'descripcion': 'Para decidir antes de fin de mes',
        'fecha_cierre': manana(),
        'preguntas': [
            {'texto': '¿Qué día prefieres?', 'alternativas': [{'texto': 'Sábado'}, {'texto': 'Domingo'}]},
            {'texto': '¿A qué hora?', 'alternativas': [{'texto': '10:00'}, {'texto': '16:00'}, {'texto': '19:00'}]},
        ],
    }
    datos.update(extra)
    return datos


class BaseEncuestas(APITestCase):

    def setUp(self):
        self.aromos = Comunidad.objects.create(nombre='Los Aromos')
        self.robles = Comunidad.objects.create(nombre='Los Robles')

        self.lider = User.objects.create_user('lider', password='clave12345')
        self.colaborador = User.objects.create_user('colab', password='clave12345')
        self.colaborador2 = User.objects.create_user('colab2', password='clave12345')
        self.lider_robles = User.objects.create_user('lider_robles', password='clave12345')
        self.admin = User.objects.create_user('admin', password='clave12345', is_staff=True)

        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.aromos, rol='lider')
        UsuarioComunidad.objects.create(usuario=self.colaborador, comunidad=self.aromos, rol='colaborador')
        UsuarioComunidad.objects.create(usuario=self.colaborador2, comunidad=self.aromos, rol='colaborador')
        UsuarioComunidad.objects.create(usuario=self.lider_robles, comunidad=self.robles, rol='lider')

    def crear(self, usuario=None, **extra):
        self.client.force_authenticate(usuario or self.lider)
        return self.client.post(URL, datos_encuesta(**extra), format='json')

    def encuesta_creada(self):
        r = self.crear()
        self.assertEqual(r.status_code, 201, r.data)
        return r.data

    def respuestas_validas(self, encuesta):
        # Elige la primera alternativa de cada pregunta
        return {'respuestas': [
            {'pregunta': p['id'], 'alternativa': p['alternativas'][0]['id']} for p in encuesta['preguntas']
        ]}

    def responder(self, usuario, encuesta, datos=None):
        self.client.force_authenticate(usuario)
        return self.client.post(f"{URL}{encuesta['id']}/responder/",
                                datos or self.respuestas_validas(encuesta), format='json')


class CrearEncuestaTests(BaseEncuestas):

    def test_lider_crea_encuesta_en_su_comunidad(self):
        r = self.crear()
        self.assertEqual(r.status_code, 201, r.data)
        encuesta = Encuesta.objects.get()
        self.assertEqual(encuesta.comunidad, self.aromos)      # criterio 4: asignada sola
        self.assertEqual(encuesta.creada_por, self.lider)
        self.assertEqual(encuesta.preguntas.count(), 2)
        self.assertEqual(encuesta.preguntas.last().alternativas.count(), 3)

    def test_colaborador_no_puede_crear(self):
        self.assertEqual(self.crear(self.colaborador).status_code, 403)
        self.assertFalse(Encuesta.objects.exists())

    def test_lider_no_puede_crear_en_otra_comunidad(self):
        self.assertEqual(self.crear(comunidad=self.robles.id).status_code, 403)

    def test_lider_de_varias_debe_elegir_comunidad(self):
        UsuarioComunidad.objects.create(usuario=self.lider, comunidad=self.robles, rol='lider')
        self.assertEqual(self.crear().status_code, 400)
        r = self.crear(comunidad=self.robles.id)
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(Encuesta.objects.get().comunidad, self.robles)

    def test_sin_preguntas_no_se_crea(self):
        r = self.crear(preguntas=[])
        self.assertEqual(r.status_code, 400)
        self.assertIn('preguntas', r.data)

    def test_maximo_5_preguntas(self):
        pregunta = {'texto': 'P', 'alternativas': [{'texto': 'Sí'}, {'texto': 'No'}]}
        self.assertEqual(self.crear(preguntas=[pregunta] * 5).status_code, 201)
        r = self.crear(preguntas=[pregunta] * 6)
        self.assertEqual(r.status_code, 400)
        self.assertIn('preguntas', r.data)

    def test_minimo_2_alternativas(self):
        r = self.crear(preguntas=[{'texto': 'P', 'alternativas': [{'texto': 'Única'}]}])
        self.assertEqual(r.status_code, 400)

    def test_maximo_5_alternativas(self):
        alternativas = [{'texto': f'Opción {i}'} for i in range(6)]
        r = self.crear(preguntas=[{'texto': 'P', 'alternativas': alternativas}])
        self.assertEqual(r.status_code, 400)

    def test_alternativas_repetidas_no_se_aceptan(self):
        r = self.crear(preguntas=[{'texto': 'P', 'alternativas': [{'texto': 'Sí'}, {'texto': 'sí'}]}])
        self.assertEqual(r.status_code, 400)

    def test_fecha_cierre_debe_ser_futura(self):
        ayer = (timezone.now() - timedelta(days=1)).isoformat()
        r = self.crear(fecha_cierre=ayer)
        self.assertEqual(r.status_code, 400)
        self.assertIn('fecha_cierre', r.data)

    def test_titulo_obligatorio(self):
        r = self.crear(titulo='  ')
        self.assertEqual(r.status_code, 400)
        self.assertIn('titulo', r.data)

    def test_lider_edita_si_nadie_respondio(self):
        encuesta = self.encuesta_creada()
        self.client.force_authenticate(self.lider)
        r = self.client.put(f"{URL}{encuesta['id']}/", datos_encuesta(titulo='Título corregido'), format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(Encuesta.objects.get().titulo, 'Título corregido')

    def test_no_se_edita_si_alguien_respondio(self):
        encuesta = self.encuesta_creada()
        self.assertEqual(self.responder(self.colaborador, encuesta).status_code, 201)
        self.client.force_authenticate(self.lider)
        r = self.client.put(f"{URL}{encuesta['id']}/", datos_encuesta(titulo='Otro'), format='json')
        self.assertEqual(r.status_code, 400)
        self.assertNotEqual(Encuesta.objects.get().titulo, 'Otro')

    def test_colaborador_no_puede_editar(self):
        encuesta = self.encuesta_creada()
        self.client.force_authenticate(self.colaborador)
        r = self.client.patch(f"{URL}{encuesta['id']}/", {'titulo': 'X'}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_puede_editar_en_la_respuesta(self):
        encuesta = self.encuesta_creada()
        self.assertTrue(encuesta['puede_editar'])
        self.responder(self.colaborador, encuesta)
        self.client.force_authenticate(self.lider)
        self.assertFalse(self.client.get(f"{URL}{encuesta['id']}/").data['puede_editar'])


class ResponderEncuestaTests(BaseEncuestas):

    def test_miembro_ve_encuestas_de_su_comunidad(self):
        self.encuesta_creada()
        self.client.force_authenticate(self.colaborador)
        self.assertEqual(len(self.client.get(URL).data), 1)
        self.client.force_authenticate(self.lider_robles)
        self.assertEqual(len(self.client.get(URL).data), 0)

    def test_colaborador_responde(self):
        encuesta = self.encuesta_creada()
        r = self.responder(self.colaborador, encuesta)
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(Participacion.objects.count(), 1)
        self.assertEqual(Respuesta.objects.count(), 2)      # una por pregunta
        # Criterio 5: queda marcada como respondida
        self.client.force_authenticate(self.colaborador)
        self.assertTrue(self.client.get(f"{URL}{encuesta['id']}/").data['ya_respondi'])

    def test_responde_una_sola_vez(self):
        encuesta = self.encuesta_creada()
        self.assertEqual(self.responder(self.colaborador, encuesta).status_code, 201)
        self.assertEqual(self.responder(self.colaborador, encuesta).status_code, 400)
        self.assertEqual(Participacion.objects.count(), 1)

    def test_debe_responder_todas_las_preguntas(self):
        encuesta = self.encuesta_creada()
        incompleta = self.respuestas_validas(encuesta)
        incompleta['respuestas'] = incompleta['respuestas'][:1]
        self.assertEqual(self.responder(self.colaborador, encuesta, incompleta).status_code, 400)
        self.assertFalse(Participacion.objects.exists())

    def test_alternativa_de_otra_pregunta_no_vale(self):
        encuesta = self.encuesta_creada()
        p1, p2 = encuesta['preguntas']
        datos = {'respuestas': [
            {'pregunta': p1['id'], 'alternativa': p2['alternativas'][0]['id']},
            {'pregunta': p2['id'], 'alternativa': p2['alternativas'][0]['id']},
        ]}
        self.assertEqual(self.responder(self.colaborador, encuesta, datos).status_code, 400)

    def test_no_se_responde_despues_del_cierre(self):
        encuesta = self.encuesta_creada()
        Encuesta.objects.filter(id=encuesta['id']).update(fecha_cierre=timezone.now() - timedelta(minutes=1))
        r = self.responder(self.colaborador, encuesta)
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Participacion.objects.exists())

    def test_usuario_de_otra_comunidad_no_puede_responder(self):
        encuesta = self.encuesta_creada()
        # No la ve (404), y por lo tanto tampoco puede responderla
        self.assertEqual(self.responder(self.lider_robles, encuesta).status_code, 404)

    def test_respuestas_son_anonimas(self):
        encuesta = self.encuesta_creada()
        self.responder(self.colaborador, encuesta)
        # La tabla de respuestas no tiene ninguna columna que apunte a un usuario
        campos = {f.name for f in Respuesta._meta.get_fields()}
        self.assertNotIn('usuario', campos)
        # Y la API no expone qué respondió cada uno
        self.client.force_authenticate(self.lider)
        detalle = self.client.get(f"{URL}{encuesta['id']}/").data
        self.assertNotIn('respuestas', detalle)
        self.assertNotIn('participaciones', detalle)

    def test_estado_abiertas_y_cerradas(self):
        abierta = self.encuesta_creada()
        cerrada = self.encuesta_creada()
        Encuesta.objects.filter(id=cerrada['id']).update(fecha_cierre=timezone.now() - timedelta(minutes=1))
        self.client.force_authenticate(self.colaborador)
        self.assertEqual([e['id'] for e in self.client.get(URL + '?estado=abiertas').data], [abierta['id']])
        self.assertEqual([e['id'] for e in self.client.get(URL + '?estado=cerradas').data], [cerrada['id']])
