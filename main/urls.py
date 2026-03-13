from django.contrib import admin
from django.urls import path
from ep_files_app.api.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
]