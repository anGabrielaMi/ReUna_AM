from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('avisos', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='aviso',
            options={'ordering': ['-fecha_publicacion', '-id']},
        ),
        migrations.AddField(
            model_name='aviso',
            name='categoria',
            field=models.CharField(
                choices=[('general', 'General'), ('evento', 'Evento'), ('comunidad', 'Comunidad'),
                         ('mantencion', 'Mantención'), ('urgente', 'Urgente')],
                default='general', max_length=20),
        ),
    ]
