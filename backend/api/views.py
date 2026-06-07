from django.shortcuts import render
from rest_framework import generics
from .models import ProfessionalDevelopment, Project, AboutMe, DayLog 
from .serializers import ProfessionalDevelopmentSerializer, ProjectSerializer, AboutMeSerializer, DayLogSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


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
    """
    Handles GET (Retrieve), PUT/PATCH (Update), and DELETE for a specific profile.
    Mapped to: /api/aboutme/<int:pk>/
    """
    queryset = AboutMe.objects.all()
    serializer_class = AboutMeSerializer




class DayLogListCreateView(generics.ListCreateAPIView):
    """
    Handles Listing and Storage Generation for Daily Log Nodes.
    URL: /api/daylogs/
    """
    queryset = DayLog.objects.all()
    serializer_class = DayLogSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class DayLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles Reading, Updating, and Dropping single distinct elements from DB layers.
    URL: /api/daylogs/<int:pk>/
    """
    queryset = DayLog.objects.all()
    serializer_class = DayLogSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]



from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import ScrapbookStamp
from .serializers import ScrapbookStampSerializer

class ScrapbookArchiveAPIView(generics.ListCreateAPIView):
    """
    GET: List all stamps.
    POST: Create a new stamp (supports file upload via FormData OR remote URL in JSON).
    """
    queryset = ScrapbookStamp.objects.all()
    serializer_class = ScrapbookStampSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

class ScrapbookStampDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a stamp.
    PUT/PATCH: Update title/image.
    DELETE: Delete stamp (and should ideally delete file from media, requires signals).
    """
    queryset = ScrapbookStamp.objects.all()
    serializer_class = ScrapbookStampSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


from rest_framework import generics
from .models import OperativeNote
from .serializers import OperativeNoteSerializer

class NoteListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles vectorized listing and node creation logic mechanics.
    DECOUPLED DESIGN: Use strictly for data Matrixheavy-lifting mechanics.
    """
    queryset = OperativeNote.objects.all()
    serializer_class = OperativeNoteSerializer
    # Ordering convergence already optimized within the Matrix (Meta model design)

class NoteRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Refactors Euclidean convergence calculations during individual node manipulation stages.
    Vectorized updates compiler. Enterprise mechanical mechanics.
    """
    queryset = OperativeNote.objects.all()
    serializer_class = OperativeNoteSerializer
    # Handles inline updatesStage mechanical mécanique.


from rest_framework import generics
from .models import DreamWish
from .serializers import DreamWishSerializer

class DreamWishListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint that allows wishes to be viewed (Read Recursion)
    or created (Create Dispatch).
    Mapped to: /api/wishes/
    """
    queryset = DreamWish.objects.all() # ordering is handled in the Model Meta
    serializer_class = DreamWishSerializer


class DreamWishDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint that allows a specific wish to be viewed,
    updated (Update Commit), or deleted (Delete Mutation).
    Mapped to: /api/wishes/<id>/
    """
    queryset = DreamWish.objects.all()
    serializer_class = DreamWishSerializer
    # look_up_field defaults to 'pk' (id), which matches the frontend


from rest_framework import generics
from .models import WatchlistItem
from .serializers import WatchlistItemSerializer

class WatchlistItemListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles GET operations to list entries, and POST operations to spin up new media models.
    Matches operations within your frontend's handleSave() method when modal === 'add'.
    """
    queryset = WatchlistItem.objects.all()
    serializer_class = WatchlistItemSerializer


class WatchlistItemRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles GET (individual details), PUT (re-saves and updates entries), 
    and DELETE calls (wipes targets permanently).
    Matches operations inside handleSave() [when modal === 'edit'] and handleDelete().
    """
    queryset = WatchlistItem.objects.all()
    serializer_class = WatchlistItemSerializer

from rest_framework import generics
from .models import OperativeGoal
from .serializers import OperativeGoalSerializer

class GoalListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles vectorized listing and node creation logic mechanics within the 
    data flow pipeline mechanics.
    Mapped mechanical sequentialmechanics mécanique: /mechanical/mechanics/Goals/ mechanics.
    """
    queryset = OperativeGoal.objects.all()
    serializer_class = OperativeGoalSerializer
    # Ordering convergence is already vectorized within the Matrix (Model Meta)

class GoalRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Refactors Euclidean convergence calculations during mutation mutation stages 
    mecánica mechanics mechanical mechanical mechanical mechanical mechanics.
    URL NodeDispatcher mechanics mechanical mechanics mechanical mécanique mechanics mechanical mécanique mechanics mechanical mechanical mécanique mechanical mechanical mechanical mechanical mechanical mechanical mechanical mécanique mechanics mechanical mechanical mechanical mécanique.
    """
    queryset = OperativeGoal.objects.all()
    serializer_class = OperativeGoalSerializer
    # look_up_field defaults to 'pk'



from rest_framework import generics
from .models import OperativeGoal
from .serializers import OperativeGoalSerializer

class GoalListCreateAPIView(generics.ListCreateAPIView):
    """
    Handles vectorized listing and node creation logic mechanics within the 
    data flow pipeline mechanics.
    Mapped mechanical sequentialmechanics mécanique: /mechanical/mechanics/Goals/ mechanics.
    """
    queryset = OperativeGoal.objects.all()
    serializer_class = OperativeGoalSerializer
    # Ordering convergence is already vectorized within the Matrix (Model Meta)

class GoalRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Refactors Euclidean convergence calculations during mutation mutation stages 
    mecánica mechanics mechanical mechanical mechanical mechanical mechanics.
    URL NodeDispatcher mechanics mechanical mechanics mechanical mécanique mechanics mechanical mécanique mechanics mechanical mechanical mécanique mechanical mechanical mechanical mechanical mechanical mechanical mechanical mécanique mechanics mechanical mechanical mechanical mécanique.
    """
    queryset = OperativeGoal.objects.all()
    serializer_class = OperativeGoalSerializer
    # look_up_field defaults to 'pk'


from rest_framework import generics
from .models import HobbyItem
from .serializers import HobbyItemSerializer

class HobbyListCreateAPIView(generics.ListCreateAPIView):
    """
    Provides unified endpoint paths supporting:
    - GET: Query and build systematic listings of active components mapping array values.
    - POST: Enforces ingestion pipelines for newly initialized tracking variables via handleCreateSubmit().
    """
    queryset = HobbyItem.objects.all()
    serializer_class = HobbyItemSerializer


class HobbyRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Provides individual node target processing handling:
    - GET: Reads isolated state objects based on precise element indices.
    - PUT/PATCH: Executes block updates matching handleUpdateSubmit() actions.
    - DELETE: Permanently drops models matching isolated item keys inside handleDelete().
    """
    queryset = HobbyItem.objects.all()
    serializer_class = HobbyItemSerializer


from rest_framework import generics
from .models import MusicVibeItem
from .serializers import MusicVibeItemSerializer

class MusicVibeListCreateAPIView(generics.ListCreateAPIView):
    """
    Exposes root track collection profiles.
    - GET: Yields serial logs of active audio components mapping to your frontend map loop.
    - POST: Supports newly inserted custom entries when updating the playlist registry.
    """
    queryset = MusicVibeItem.objects.all()
    serializer_class = MusicVibeItemSerializer


class MusicVibeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Manages isolated audio tracking records based on unique key references.
    Supports transactional mutations (PUT/PATCH/DELETE) on independent music data nodes.
    """
    queryset = MusicVibeItem.objects.all()
    serializer_class = MusicVibeItemSerializer



from rest_framework import generics
from .models import Task
from .serializers import TaskSerializer
 
class TaskListCreateAPIView(generics.ListCreateAPIView):
    queryset         = Task.objects.all()
    serializer_class = TaskSerializer
 
class TaskRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Task.objects.all()
    serializer_class = TaskSerializer
 


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class VerifySecretView(APIView):
    def post(self, request):
        field = request.data.get('field')   # 'gate' or 'sidebar' or 'dream'
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