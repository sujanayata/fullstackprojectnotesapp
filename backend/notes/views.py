from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Note
from .serializers import NoteSerializer

class NoteListCreate(APIView):
    """
    GET  : List all notes (search by title or description)
    POST : Upload a new note
    """

    def get(self, request):
        search_query = request.GET.get("search", "")  # get from query param
        notes = Note.objects.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query)
        ).order_by("-uploaded_at")
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NoteDetail(APIView):
    """
    GET    : Get a single note by ID
    DELETE : Delete a note by ID
    """

    def get_object(self, pk):
        try:
            return Note.objects.get(pk=pk)
        except Note.DoesNotExist:
            return None

    def get(self, request, pk):
        note = self.get_object(pk)
        if note is None:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = NoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        note = self.get_object(pk)
        if note is None:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
        note.delete()
        return Response({"message": "Note deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
