from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .forms import ContactForm  # Assume you have a ContactForm
import environ

env = environ.Env()
environ.Env.read_env()

@ratelimit(key='ip', rate='5/m', method='ALL', burst=True)
def send_contact_message(request):
    if request.method == 'POST':
        # Get data from the form (ensure you validate it)
        form = ContactForm(request.POST)

        if form.is_valid():
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            message = form.cleaned_data['message']

            try:
                send_mail(
                    f"Message from {name}",
                    message,
                    email,
                    env(EMAIL_USER),
                )
                return JsonResponse({'message': 'Message sent successfully!'}, status=200)
            except Exception as e:
                return JsonResponse({'message': f'Error: {str(e)}'}, status=500)
        else:
            return JsonResponse({'message': 'Invalid data provided.'}, status=400)
    else:
        return JsonResponse({'message': 'Invalid request method.'}, status=400)
