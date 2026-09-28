from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('avisos', '0005_aviso_publicado_editado_por'),
    ]

    operations = [
        migrations.AddField(
            model_name='aviso',
            name='fijado',
            field=models.BooleanField(default=False, help_text='Si está marcado, el aviso aparece primero en la lista.'),
        ),
        migrations.AlterModelOptions(
            name='aviso',
            options={'ordering': ['-fijado', '-fecha_publicacion', '-id']},
        ),
    ]
