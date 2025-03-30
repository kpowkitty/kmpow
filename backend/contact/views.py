from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit
from django.views.decorators.csrf import csrf_exempt
from .forms import ContactForm
import environ

env = environ.Env()
environ.Env.read_env()

@ratelimit(key='ip', rate='5/m', method='ALL')
def send_contact_message(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method Not Allowed'}, status=405)

    form = ContactForm(request.POST)
    if form.is_valid():
        # Process form submission (send email, store data, etc.)
        return JsonResponse({'message': 'Message sent successfully!'}, status=200)

    return JsonResponse({'error': 'Invalid data'}, status=400)
