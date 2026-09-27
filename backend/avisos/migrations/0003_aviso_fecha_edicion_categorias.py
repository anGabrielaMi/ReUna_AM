import django.utils.timezone
from django.db import migrations, models


def migrar_categorias(apps, schema_editor):
    # Las categorías antiguas que ya no existen pasan a su equivalente nuevo
    Aviso = apps.get_model('avisos', 'Aviso')
    Aviso.objects.filter(categoria='comunidad').update(categoria='comunicado')
    Aviso.objects.filter(categoria='mantencion').update(categoria='general')


class Migration(migrations.Migration):

    dependencies = [
        ('avisos', '0002_aviso_categoria_orden'),
    ]

    operations = [
        migrations.AddField(
            model_name='aviso',
            name='fecha_edicion',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='aviso',
            name='categoria',
            field=models.CharField(
                choices=[('reunion', 'Reunión'), ('evento', 'Evento'), ('comunicado', 'Comunicado'),
                         ('encuesta', 'Encuesta'), ('urgente', 'Urgente'), ('general', 'General')],
                default='general', max_length=20),
        ),
        migrations.RunPython(migrar_categorias, migrations.RunPython.noop),
    ]
