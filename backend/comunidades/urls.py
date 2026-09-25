from rest_framework.routers import DefaultRouter
from .views import ComunidadViewSet

router = DefaultRouter()
router.register(r'comunidades', ComunidadViewSet)

urlpatterns = router.urls
