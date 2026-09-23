from django.shortcuts import render
from django.db import connection
from rest_framework import generics, status
from .models import Challenge, ChallengeDay, PDFDocument, ProfessionalDevelopment, Project, AboutMe, DayLog, OperativeGoal, GoalDayStatus, ScrapbookStamp, OperativeNote, DreamWish, WatchlistItem, HobbyItem, MusicVibeItem, Task
from .serializers import ChallengeSerializer,PDFDocumentSerializer, InstantStatusSerializer, ProfessionalDevelopmentSerializer, ProjectSerializer, DreamWishSerializer, HobbyItemSerializer, MusicVibeItemSerializer, TaskSerializer, AboutMeSerializer, DayLogSerializer, OperativeNoteSerializer, ScrapbookStampSerializer, DreamWishSerializer, WatchlistItemSerializer, OperativeGoalSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser 
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import action
from django.http import HttpResponse, Http404


class HealthView(APIView):
    """Lightweight liveness/readiness probe.

    Point external uptime monitors (UptimeRobot, cron-job.org, etc.) at this
    endpoint every 5 minutes. It also opens a DB connection so a warm request
    actually warms the database path, not just the web process.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            db_ok = False

        return Response(
            {"status": "ok" if db_ok else "degraded", "db": db_ok},
            status=status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class projectListView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class ProfessionalDevelopmentListView(generics.ListCreateAPIView):
    queryset = ProfessionalDevelopment.objects.all()
    serializer_class = ProfessionalDevelopmentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]  

class ProfessionalDevelopmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProfessionalDevelopment.objects.all()
    serializer_class = ProfessionalDevelopmentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser] 

class AboutMeListCreateView(generics.ListCreateAPIView):
    queryset = AboutMe.objects.all()
    serializer_class = AboutMeSerializer

class AboutMeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AboutMe.objects.all()
    serializer_class = AboutMeSerializer

class DayLogListCreateView(generics.ListCreateAPIView):
    queryset = DayLog.objects.all()
    serializer_class = DayLogSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

class DayLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DayLog.objects.all()
    serializer_class = DayLogSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class ScrapbookArchiveAPIView(generics.ListCreateAPIView):
    queryset = ScrapbookStamp.objects.all()
    serializer_class = ScrapbookStampSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

class ScrapbookStampDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ScrapbookStamp.objects.all()
    serializer_class = ScrapbookStampSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

class NoteListCreateAPIView(generics.ListCreateAPIView):
    queryset = OperativeNote.objects.all()
    serializer_class = OperativeNoteSerializer

class NoteRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OperativeNote.objects.all()
    serializer_class = OperativeNoteSerializer


class DreamWishListCreateAPIView(generics.ListCreateAPIView):
    queryset = DreamWish.objects.all() 
    serializer_class = DreamWishSerializer


class DreamWishDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = DreamWish.objects.all()
    serializer_class = DreamWishSerializer

class WatchlistItemListCreateAPIView(generics.ListCreateAPIView):
    queryset = WatchlistItem.objects.all()
    serializer_class = WatchlistItemSerializer
 
 
class WatchlistItemRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WatchlistItem.objects.all()
    serializer_class = WatchlistItemSerializer
 

class GoalListCreateAPIView(generics.ListCreateAPIView):
    queryset = OperativeGoal.objects.prefetch_related('day_statuses').all()
    serializer_class = OperativeGoalSerializer


class GoalRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OperativeGoal.objects.prefetch_related('day_statuses').all()
    serializer_class = OperativeGoalSerializer


class GoalDayToggleAPIView(APIView):
    def patch(self, request, pk, day_number):
        goal = get_object_or_404(OperativeGoal, pk=pk)
        day_status = get_object_or_404(
            GoalDayStatus, goal=goal, day_number=day_number
        )

        day_status.done = not day_status.done
        day_status.save()

        goal.sync_done_status()

        serializer = OperativeGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)

class HobbyListCreateAPIView(generics.ListCreateAPIView):
    queryset = HobbyItem.objects.all()
    serializer_class = HobbyItemSerializer


class HobbyRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HobbyItem.objects.all()
    serializer_class = HobbyItemSerializer


class MusicVibeListCreateAPIView(generics.ListCreateAPIView):
    queryset = MusicVibeItem.objects.all()
    serializer_class = MusicVibeItemSerializer


class MusicVibeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MusicVibeItem.objects.all()
    serializer_class = MusicVibeItemSerializer



class TaskListCreateAPIView(generics.ListCreateAPIView):
    queryset         = Task.objects.all()
    serializer_class = TaskSerializer
 
class TaskRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Task.objects.all()
    serializer_class = TaskSerializer
 


class VerifySecretView(APIView):
    def post(self, request):
        field = request.data.get('field') 
        value = request.data.get('value', '')
        
        record = AboutMe.objects.first()
        if not record:
            return Response({'allowed': False})
        
        if field == 'gate':
            allowed = value == record.base_secret_code
        elif field == 'sidebar':
            allowed = value == record.sidebar_code
        elif field == 'dream':
            allowed = value == record.portal_dream
        else:
            allowed = False
            
        return Response({'allowed': allowed})

class ChallengeListCreateAPIView(generics.ListCreateAPIView):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer


class ChallengeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer


class ChallengeMarkDayAPIView(APIView):
    def post(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk)

        if challenge.type != Challenge.ChallengeType.DAYS:
            return Response(
                {'detail': 'Only days challenges have daily marking.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()
        if not challenge.is_today_editable():
            return Response(
                {'detail': 'This challenge has no editable day today.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        day = challenge.days.filter(date=today).first()
        if day:
            day.delete()
            completed = False
        else:
            ChallengeDay.objects.create(challenge=challenge, date=today)
            completed = True

        return Response(
            {'date': today, 'completed': completed, 'stats': challenge.get_stats()},
            status=status.HTTP_200_OK,
        )


class ChallengeInstantStatusAPIView(APIView):
    def patch(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk)

        if challenge.type != Challenge.ChallengeType.INSTANT:
            return Response(
                {'detail': 'Only instant challenges have a status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InstantStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        challenge.instant_status = serializer.validated_data['instant_status']
        challenge.save(update_fields=['instant_status'])

        return Response(ChallengeSerializer(challenge).data)


def _storage_bytes(file_field):
    storage = file_field.storage
    return storage.client.storage.from_(storage.bucket_name).download(file_field.name)


class PDFListCreateView(generics.ListCreateAPIView):
    queryset = PDFDocument.objects.all()
    serializer_class = PDFDocumentSerializer

    def get_serializer_context(self):
        return {"request": self.request}


class PDFDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PDFDocument.objects.all()
    serializer_class = PDFDocumentSerializer
    lookup_field = "id"

    def get_serializer_context(self):
        return {"request": self.request}


class PDFDownloadView(APIView):
    def get(self, request, id):
        doc = get_object_or_404(PDFDocument, id=id)

        try:
            data = _storage_bytes(doc.file)
        except Exception:
            raise Http404("File not found in storage.")

        filename = doc.file.name.split("/")[-1]
        response = HttpResponse(data, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response