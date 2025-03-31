from django.db import models

class ContactForm(models.Model):
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    phone = models.CharField(max_length=10,null=True)  
    email = models.EmailField()
    message = models.TextField()

    def __str__(self):
        return self.name
