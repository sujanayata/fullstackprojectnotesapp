from django.urls import path
from .views import NoteListCreate, NoteDetail, download_note

urlpatterns = [
    path("notes/", NoteListCreate.as_view()),
    path("notes/<int:pk>/", NoteDetail.as_view()),
    path("notes/<int:pk>/download/", download_note),
]
