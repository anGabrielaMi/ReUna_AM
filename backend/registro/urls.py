from django.urls import path
from .views import RegistroView

urlpatterns = [
    path('register/', RegistroView.as_view(), name='register'),
]
