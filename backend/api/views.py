from django.shortcuts import render
from django.db import connection
from django.db.models import F, Q, Count
from rest_framework import generics, status
from .models import Challenge, ChallengeDay, PDFDocument, ProfessionalDevelopment, Project, AboutMe, DayLog, OperativeGoal, GoalDayStatus, ScrapbookStamp, OperativeNote, DreamWish, WatchlistItem, HobbyItem, MusicVibeItem, Task, BlogCategory, BlogPost, BlogComment
from .serializers import ChallengeSerializer,PDFDocumentSerializer, InstantStatusSerializer, ProfessionalDevelopmentSerializer, ProjectSerializer, DreamWishSerializer, HobbyItemSerializer, MusicVibeItemSerializer, TaskSerializer, AboutMeSerializer, DayLogSerializer, OperativeNoteSerializer, ScrapbookStampSerializer, DreamWishSerializer, WatchlistItemSerializer, OperativeGoalSerializer, BlogCategorySerializer, BlogPostListSerializer, BlogPostDetailSerializer, BlogCommentSerializer, BlogImageUploadSerializer
from django.core.files.storage import default_storage
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


# ---------------------------------------------------------------------------
# Blog
# ---------------------------------------------------------------------------


class BlogCategoryListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BlogCategorySerializer

    def get_queryset(self):
        return BlogCategory.objects.annotate(post_count=Count('posts'))


class BlogImageUploadAPIView(APIView):
    """Upload an image to embed inside a blog post body.

    Returns a public URL that the editor drops into the Markdown as
    ``![alt](url)``.
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = BlogImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data['image']

        name = default_storage.save(upload.name, upload)
        return Response(
            {'url': default_storage.url(name), 'name': name},
            status=status.HTTP_201_CREATED,
        )


class BlogCategoryRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BlogCategorySerializer

    def get_queryset(self):
        return BlogCategory.objects.annotate(post_count=Count('posts'))


class BlogPostListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BlogPostListSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        # Writes need the `content` field, which the lightweight list
        # serializer omits.
        if self.request.method == 'POST':
            return BlogPostDetailSerializer
        return BlogPostListSerializer

    def get_queryset(self):
        qs = BlogPost.objects.select_related('category').annotate(comment_count=Count('comments'))
        params = self.request.query_params

        status_param = params.get('status')
        if status_param in ('draft', 'published'):
            qs = qs.filter(status=status_param)

        category = params.get('category')
        if category:
            if str(category).isdigit():
                qs = qs.filter(category_id=category)
            else:
                qs = qs.filter(category__slug=category)

        tag = params.get('tag')
        if tag:
            qs = qs.filter(tags__icontains=tag)

        featured = params.get('featured')
        if featured in ('true', '1'):
            qs = qs.filter(is_featured=True)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(excerpt__icontains=search)
                | Q(content__icontains=search)
                | Q(tags__icontains=search)
            )

        ordering = params.get('ordering')
        allowed = {
            'newest': '-created_at',
            'oldest': 'created_at',
            'popular': '-views',
            'liked': '-likes',
            'title': 'title',
        }
        if ordering in allowed:
            qs = qs.order_by(allowed[ordering])

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        output = BlogPostDetailSerializer(post, context={'request': request})
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class BlogPostRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BlogPostListSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            BlogPost.objects.select_related('category')
            .prefetch_related('comments')
            .annotate(comment_count=Count('comments'))
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return BlogPostDetailSerializer
        return BlogPostListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        output = BlogPostDetailSerializer(instance, context={'request': request})
        return Response(output.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        output = BlogPostDetailSerializer(post, context={'request': request})
        return Response(output.data)


class BlogPostLikeAPIView(APIView):
    """Increment (or decrement) a post's like counter."""

    def post(self, request, pk):
        post = get_object_or_404(BlogPost, pk=pk)
        liked = request.data.get('like', True)
        liked = str(liked).lower() not in ('false', '0', 'no')

        if liked:
            BlogPost.objects.filter(pk=pk).update(likes=F('likes') + 1)
        else:
            BlogPost.objects.filter(pk=pk, likes__gt=0).update(likes=F('likes') - 1)

        post.refresh_from_db(fields=['likes'])
        return Response({'id': post.id, 'likes': post.likes})


class BlogPostViewAPIView(APIView):
    """Count a view when a post is opened."""

    def post(self, request, pk):
        get_object_or_404(BlogPost, pk=pk)
        BlogPost.objects.filter(pk=pk).update(views=F('views') + 1)
        post = BlogPost.objects.only('id', 'views').get(pk=pk)
        return Response({'id': post.id, 'views': post.views})


class BlogCommentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BlogCommentSerializer

    def get_queryset(self):
        qs = BlogComment.objects.select_related('post').all()
        post = self.request.query_params.get('post')
        if post:
            qs = qs.filter(post_id=post)
        return qs


class BlogCommentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogComment.objects.all()
    serializer_class = BlogCommentSerializer