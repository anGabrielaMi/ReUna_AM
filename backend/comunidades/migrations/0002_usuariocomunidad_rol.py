"""
Publicar aviso – rol de líder por comunidad.

Convierte Comunidad.usuarios (M2M simple) en una tabla intermedia UsuarioComunidad
con el campo 'rol', SIN perder los miembros actuales (todos quedan como colaboradores).
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def copiar_miembros(apps, schema_editor):
    Comunidad = apps.get_model('comunidades', 'Comunidad')
    UsuarioComunidad = apps.get_model('comunidades', 'UsuarioComunidad')
    TablaVieja = Comunidad.usuarios.through
    UsuarioComunidad.objects.bulk_create([
        UsuarioComunidad(usuario_id=fila.user_id, comunidad_id=fila.comunidad_id, rol='colaborador')
        for fila in TablaVieja.objects.all()
    ])


class Migration(migrations.Migration):

    dependencies = [
        ('comunidades', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1) Tabla nueva con el rol
        migrations.CreateModel(
            name='UsuarioComunidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rol', models.CharField(choices=[('colaborador', 'Colaborador'), ('lider', 'Líder')],
                                         default='colaborador', max_length=20)),
                ('comunidad', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                                related_name='membresias', to='comunidades.comunidad')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                              related_name='membresias', to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': 'miembro', 'verbose_name_plural': 'miembros'},
        ),
        migrations.AddConstraint(
            model_name='usuariocomunidad',
            constraint=models.UniqueConstraint(fields=('usuario', 'comunidad'), name='usuario_unico_por_comunidad'),
        ),
        # 2) Copiar los miembros actuales (quedan como colaboradores)
        migrations.RunPython(copiar_miembros, migrations.RunPython.noop),
        # 3) Reemplazar el M2M simple por uno que usa la tabla nueva
        migrations.RemoveField(model_name='comunidad', name='usuarios'),
        migrations.AddField(
            model_name='comunidad',
            name='usuarios',
            field=models.ManyToManyField(related_name='comunidades', through='comunidades.UsuarioComunidad',
                                         to=settings.AUTH_USER_MODEL),
        ),
    ]
