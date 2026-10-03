"""
Permiso de líder reutilizable.

La regla "solo el líder de esa comunidad puede publicar" la usan avisos,
documentos (y luego encuestas). Vive aquí para no repetirla en cada app.
"""
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import UsuarioComunidad


def ids_comunidades_lider(user):
    """Ids de las comunidades donde el usuario es líder (vacío si no hay sesión)."""
    if not user or not user.is_authenticated:
        return set()
    return set(
        UsuarioComunidad.objects
        .filter(usuario=user, rol=UsuarioComunidad.ROL_LIDER)
        .values_list('comunidad_id', flat=True)
    )


def ids_comunidades_miembro(user):
    """Ids de las comunidades a las que pertenece el usuario (con cualquier rol)."""
    if not user or not user.is_authenticated:
        return set()
    return set(
        UsuarioComunidad.objects
        .filter(usuario=user)
        .values_list('comunidad_id', flat=True)
    )


def comunidad_para_publicar(user, comunidad, ids_lider=None, que='publicar'):
    """
    Decide en qué comunidad puede publicar un líder y valida el permiso.

    - Si no es líder en ninguna comunidad -> 403.
    - Si no indica comunidad: se usa la única donde es líder; si es de varias, debe elegir (400).
    - Si indica una comunidad donde no es líder -> 403.

    Devuelve el id de la comunidad. El administrador (is_staff) NO pasa por aquí:
    cada vista decide qué puede hacer él.
    """
    if ids_lider is None:
        ids_lider = ids_comunidades_lider(user)

    if not ids_lider:
        raise PermissionDenied(f'Solo los líderes de una comunidad pueden {que}.')

    if comunidad is None:
        if len(ids_lider) == 1:
            return next(iter(ids_lider))
        raise ValidationError({'comunidad': 'Eres líder en varias comunidades: elige una.'})

    comunidad_id = getattr(comunidad, 'id', comunidad)
    if comunidad_id not in ids_lider:
        raise PermissionDenied('No eres líder de esa comunidad.')
    return comunidad_id
