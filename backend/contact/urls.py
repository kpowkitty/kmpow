from django.urls import path
from .views import SubmitContactFormView

urlpatterns = [
    path('submit_contact_form/', SubmitContactFormView.as_view(), name='submit_contact_form'),
]
