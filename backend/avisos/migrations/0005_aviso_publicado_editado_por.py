import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('avisos', '0004_aviso_comunidad'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='aviso',
            name='publicado_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                    related_name='avisos_publicados', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='aviso',
            name='editado_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                    related_name='avisos_editados', to=settings.AUTH_USER_MODEL),
        ),
    ]
