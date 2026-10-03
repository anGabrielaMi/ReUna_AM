from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from comunidades.models import Comunidad
from .models import (
    Alternativa, Encuesta, Pregunta,
    MAX_ALTERNATIVAS, MAX_PREGUNTAS, MIN_ALTERNATIVAS, MIN_PREGUNTAS,
)


class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternativa
        fields = ['id', 'texto']
        read_only_fields = ['id']

    def validate_texto(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Cada alternativa debe tener texto.')
        return value


class PreguntaSerializer(serializers.ModelSerializer):
    alternativas = AlternativaSerializer(many=True)

    class Meta:
        model = Pregunta
        fields = ['id', 'texto', 'alternativas']
        read_only_fields = ['id']

    def validate_texto(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Cada pregunta debe tener texto.')
        return value

    def validate_alternativas(self, alternativas):
        # Crear encuesta – criterio 2: entre 2 y 5 alternativas por pregunta
        if not (MIN_ALTERNATIVAS <= len(alternativas) <= MAX_ALTERNATIVAS):
            raise serializers.ValidationError(
                f'Cada pregunta debe tener entre {MIN_ALTERNATIVAS} y {MAX_ALTERNATIVAS} alternativas.'
            )
        textos = [a['texto'].lower() for a in alternativas]
        if len(set(textos)) != len(textos):
            raise serializers.ValidationError('Las alternativas de una pregunta no se pueden repetir.')
        return alternativas


class EncuestaSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True)
    comunidad = serializers.PrimaryKeyRelatedField(
        queryset=Comunidad.objects.all(), required=False, allow_null=True,
    )
    comunidad_nombre = serializers.CharField(source='comunidad.nombre', read_only=True)
    creada_por_nombre = serializers.CharField(source='creada_por.username', read_only=True, default=None)
    abierta = serializers.BooleanField(read_only=True)
    ya_respondi = serializers.SerializerMethodField()
    puede_editar = serializers.SerializerMethodField()

    class Meta:
        model = Encuesta
        fields = ['id', 'titulo', 'descripcion', 'comunidad', 'comunidad_nombre', 'creada_por_nombre',
                  'fecha_creacion', 'fecha_cierre', 'abierta', 'ya_respondi', 'puede_editar', 'preguntas']
        read_only_fields = ['fecha_creacion']

    # ---------- datos calculados para la app ----------
    def get_ya_respondi(self, obj):
        return obj.id in self.context.get('ids_respondidas', set())

    def get_puede_editar(self, obj):
        # La app lo usa para mostrar el botón "Editar"
        if obj.id in self.context.get('ids_con_respuestas', set()):
            return False
        if self.context.get('es_admin'):
            return True
        return obj.comunidad_id in self.context.get('ids_lider', set())

    # ---------- validaciones ----------
    def validate_titulo(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El título es obligatorio.')
        return value

    def validate_fecha_cierre(self, value):
        # Crear encuesta – criterio 3: la fecha de cierre debe ser posterior a ahora
        if value <= timezone.now():
            raise serializers.ValidationError('La fecha de cierre debe ser posterior a la fecha actual.')
        return value

    def validate_preguntas(self, preguntas):
        # Crear encuesta – criterio 1: entre 1 y 5 preguntas
        if not (MIN_PREGUNTAS <= len(preguntas) <= MAX_PREGUNTAS):
            raise serializers.ValidationError(
                f'La encuesta debe tener entre {MIN_PREGUNTAS} y {MAX_PREGUNTAS} preguntas.'
            )
        return preguntas

    # ---------- guardar (encuesta + preguntas + alternativas de una vez) ----------
    def _guardar_preguntas(self, encuesta, preguntas):
        for i, p in enumerate(preguntas):
            pregunta = Pregunta.objects.create(encuesta=encuesta, texto=p['texto'], orden=i)
            Alternativa.objects.bulk_create([
                Alternativa(pregunta=pregunta, texto=a['texto'], orden=j)
                for j, a in enumerate(p['alternativas'])
            ])

    @transaction.atomic
    def create(self, validated_data):
        preguntas = validated_data.pop('preguntas')
        encuesta = Encuesta.objects.create(**validated_data)
        self._guardar_preguntas(encuesta, preguntas)
        return encuesta

    @transaction.atomic
    def update(self, instance, validated_data):
        preguntas = validated_data.pop('preguntas', None)
        validated_data.pop('comunidad', None)   # la comunidad no se cambia al editar
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)
        instance.save()
        if preguntas is not None:
            # Se reemplazan todas las preguntas (solo es posible si nadie ha respondido)
            instance.preguntas.all().delete()
            self._guardar_preguntas(instance, preguntas)
        return instance


class ResponderSerializer(serializers.Serializer):
    """
    Body de POST /api/encuestas/<id>/responder/
      {"respuestas": [{"pregunta": 1, "alternativa": 3}, {"pregunta": 2, "alternativa": 7}]}
    """
    respuestas = serializers.ListField(child=serializers.DictField(child=serializers.IntegerField()))

    def validate_respuestas(self, respuestas):
        encuesta = self.context['encuesta']
        preguntas = {p.id: p for p in encuesta.preguntas.prefetch_related('alternativas')}

        elegidas = {}
        for r in respuestas:
            pregunta_id, alternativa_id = r.get('pregunta'), r.get('alternativa')
            if pregunta_id not in preguntas:
                raise serializers.ValidationError('Hay una pregunta que no pertenece a esta encuesta.')
            if pregunta_id in elegidas:
                raise serializers.ValidationError('Solo se puede elegir una alternativa por pregunta.')
            if alternativa_id not in {a.id for a in preguntas[pregunta_id].alternativas.all()}:
                raise serializers.ValidationError('Hay una alternativa que no corresponde a su pregunta.')
            elegidas[pregunta_id] = alternativa_id

        # Responder encuesta – criterio 2: hay que contestar todas las preguntas
        if set(elegidas) != set(preguntas):
            raise serializers.ValidationError('Debes responder todas las preguntas.')
        return elegidas
