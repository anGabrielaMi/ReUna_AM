import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('avisos', '0003_aviso_fecha_edicion_categorias'),
        ('comunidades', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='aviso',
            name='comunidad',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                                    related_name='avisos', to='comunidades.comunidad'),
        ),
    ]
