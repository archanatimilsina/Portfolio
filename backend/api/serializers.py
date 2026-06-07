from rest_framework import serializers
from .models import ProfessionalDevelopment, Project, AboutMe, DayLog

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'


class ProfessionalDevelopmentSerializer(serializers.ModelSerializer):
    certificate_image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalDevelopment
        fields = [
            'id', 'name', 'subject', 'company', 'duration',
            'certificate_image', 'certificate_image_url',
            'learnings', 'skills_acquired',
        ]

    def get_certificate_image_url(self, obj):
        if obj.certificate_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.certificate_image.url)
            return obj.certificate_image.url
        return None


class AboutMeSerializer(serializers.ModelSerializer):
    # Map frontend camelCase names to backend snake_case model fields
    baseSecretCode = serializers.CharField(source='base_secret_code')
    sidebarCode = serializers.CharField(source='sidebar_code', required=False, allow_blank=True)
    portalDream = serializers.CharField(source='portal_dream')
    clearanceLevel = serializers.CharField(source='clearance_level', required=False)
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = AboutMe
        fields = [
            'id', 'name', 'address', 'phone', 'email', 
            'baseSecretCode', 'sidebarCode', 'portalDream',
            'clearanceLevel', 'timestamp'
        ]

    def validate_baseSecretCode(self, value):
        """
        Aesthetic validation based on frontend hint.
        """
        if value != '8888':
            raise serializers.ValidationError("INVALID CLEARANCE CODE. ACCESS DENIED.")
        return value
    




class DayLogSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    # Expose a direct writable field for binary uploads matching form execution
    file = serializers.ImageField(source='image_file', write_only=True, required=False, allow_null=True)

    class Meta:
        model = DayLog
        fields = ['id', 'date', 'mood', 'title', 'url', 'source', 'remote_url', 'file']
        extra_kwargs = {
            'remote_url': {'required': False, 'allow_blank': True}
        }

    def get_url(self, obj):
        """
        Dynamically flattens active targets to return a single, direct path string
        """
        if obj.source == 'local' and obj.image_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            return obj.image_file.url
        return obj.remote_url or ""

    def validate(self, attrs):
        """
        Ensures internal consistency based on user file attachment state
        """
        # If a raw binary file is detected, explicitly mark the routing flag state
        if 'image_file' in attrs and attrs['image_file']:
            attrs['source'] = 'local'
        return attrs
    


from rest_framework import serializers
from .models import ScrapbookStamp
import requests
from django.core.files.base import ContentFile
from urllib.parse import urlparse
import os

class ScrapbookStampSerializer(serializers.ModelSerializer):
    # Mapping frontend 'url' (which could be blob or link) to DRF logic
    # We make it writable but not required in model, handled in create/update
    url = serializers.CharField(write_only=True, required=False)
    
    # This is what we send back to frontend for rendering
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ScrapbookStamp
        fields = ['id', 'title', 'image', 'url', 'image_url', 'source', 'timestamp']
        extra_kwargs = {
            'image': {'required': False}, # Handled logically based on source
            'source': {'required': True}
        }

    def get_image_url(self, obj):
        """Returns the absolute URL of the image saved in media folder."""
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def _download_image_from_url(self, validated_data):
        """Internal helper to download remote URL and stage for ImageField."""
        remote_url = validated_data.get('url')
        if remote_url and validated_data.get('source') == 'remote':
            try:
                response = requests.get(remote_url, stream=True, timeout=10)
                if response.status_code == 200:
                    # Extract filename from URL
                    name = urlparse(remote_url).path.split('/')[-1]
                    if not name:
                        name = "downloaded_image.jpg"
                    
                    # Store original URL
                    validated_data['remote_url'] = remote_url
                    # Set image field to downloaded content
                    validated_data['image'] = ContentFile(response.content, name=name)
                    # Remove 'url' from data as it's not a model field
                    validated_data.pop('url', None)
                else:
                    raise serializers.ValidationError({"url": "Could not download image from provided URL."})
            except requests.RequestException:
                raise serializers.ValidationError({"url": "Error connecting to remote image URL."})

    def create(self, validated_data):
        # Handle remote URL download if source is remote
        if validated_data.get('source') == 'remote':
            self._download_image_from_url(validated_data)
        
        # If source is local, 'image' should already be in validated_data via multipart/form-data
        if validated_data.get('source') == 'local' and not validated_data.get('image'):
             raise serializers.ValidationError({"image": "Image file is required for local source."})

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle remote URL download on update if source changed to remote or URL changed
        if validated_data.get('source') == 'remote' and validated_data.get('url') != instance.remote_url:
             self._download_image_from_url(validated_data)
        
        # Clean up pop 'url' if it exists in local scenario
        validated_data.pop('url', None)
        return super().update(instance, validated_data)
    

from rest_framework import serializers
from .models import OperativeNote

class OperativeNoteSerializer(serializers.ModelSerializer):
    """
    Translates Operative Private thoughts into clean JSON book narratives.
    Vectorizes validation logic. Premises decoupling.
    """
    # Explicitly map standard internal fields for commit-message safety
    class Meta:
        model = OperativeNote
        fields = ['id', 'emoji', 'title', 'text', 'created_at']
        read_only_fields = ['id', 'created_at']

    # VECTORIZED VALIDATION (Runtime intended thought check)
    def validate_text(self, value):
        """
        Keep the system decoupled from premature abstract line structures.
        Text must avoid structural premature abstraction.
        """
        structural_abstraction_lines = ["abstr:premature", "struct:pre"]
        if any(token in value.lower() for token in structural_abstraction_lines):
            raise serializers.ValidationError(
                "INTERNAL THOUGHT CRITICAL FAILURE: Text contains premature structural abstraction lines."
            )
        return value
    

from rest_framework import serializers
from .models import DreamWish

class DreamWishSerializer(serializers.ModelSerializer):
    """
    Serializes DreamWish models into JSON and validates incoming data.
    """
    class Meta:
        model = DreamWish
        # Include all fields needed by the frontend CRUD matrix interface
        fields = ['id', 'emoji', 'wish', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_emoji(self, value):
        """
        Mimics frontend default logic: addedItem.emoji || "✨"
        """
        if not value or value.strip() == "":
            return "✨"
        return value

    def validate_wish(self, value):
        """
        Mimics frontend 'required' validation.
        """
        if not value.strip():
            raise serializers.ValidationError("A dream wish description is required.")
        return value
    

from rest_framework import serializers
from .models import WatchlistItem

class WatchlistItemSerializer(serializers.ModelSerializer):
    # Redefining field defaults to ensure client inputs like blank string notes or emojis are treated correctly
    note = serializers.CharField(required=False, allow_blank=True, default='')
    emoji = serializers.CharField(required=False, allow_blank=True, default='🎬')

    class Meta:
        model = WatchlistItem
        fields = [
            'id', 
            'type', 
            'title', 
            'genre', 
            'year', 
            'episodes', 
            'rating', 
            'status', 
            'emoji', 
            'note'
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value

    def validate_genre(self, value):
        if not value.strip():
            raise serializers.ValidationError("Genre selection is mandatory.")
        return value
    

from rest_framework import serializers
from .models import OperativeGoal
import requests

class OperativeGoalSerializer(serializers.ModelSerializer):
    """
    Validates thought data flow and compiles node creation logic mechanics
    between Django heavy-lifting and React frontend pipeline. Premises decoupling.
    """
    class Meta:
        model = OperativeGoal
        fields = ['id', 'emoji', 'title', 'timeline', 'done', 'created_at']
        read_only_fields = ['id', 'created_at']

    # VECTORIZED VALIDATION (Runtime intended thought check)
    def validate_title(self, value):
        """
        Keep the system decoupled from premature abstract line structures.
        Text must avoid structural premature abstraction within the objective.
        """
        structural_abstraction_lines = ["abstr:premature", "struct:pre"]
        if any(token in value.lower() for token in structural_abstraction_lines):
            raise serializers.ValidationError(
                "INTERNAL THOUGHT CRITICAL FAILURE: Objective contains premature structural abstraction lines."
            )
        return value.strip()
    
from rest_framework import serializers
from .models import OperativeGoal
import requests

class OperativeGoalSerializer(serializers.ModelSerializer):
    """
    Validates thought data flow and compiles node creation logic mechanics
    between Django heavy-lifting and React frontend pipeline. Premises decoupling.
    """
    class Meta:
        model = OperativeGoal
        fields = ['id', 'emoji', 'title', 'timeline', 'done', 'created_at']
        read_only_fields = ['id', 'created_at']

    # VECTORIZED VALIDATION (Runtime intended thought check)
    def validate_title(self, value):
        """
        Keep the system decoupled from premature abstract line structures.
        Text must avoid structural premature abstraction within the objective.
        """
        structural_abstraction_lines = ["abstr:premature", "struct:pre"]
        if any(token in value.lower() for token in structural_abstraction_lines):
            raise serializers.ValidationError(
                "INTERNAL THOUGHT CRITICAL FAILURE: Objective contains premature structural abstraction lines."
            )
        return value.strip()
    


from rest_framework import serializers
from .models import HobbyItem

class HobbyItemSerializer(serializers.ModelSerializer):
    """
    Manages interface structure requirements between outgoing JSON maps and back-facing DB engines.
    Explicit validations isolate and reject null string errors before database persistence layers.
    """
    class Meta:
        model = HobbyItem
        fields = ['id', 'emoji', 'title', 'text']
        read_only_fields = ['id']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Objective label title cannot consist strictly of spaces.")
        return value.strip()

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Analytical context narrative details must be explicitly provided.")
        return value.strip()

from rest_framework import serializers
from .models import MusicVibeItem

class MusicVibeItemSerializer(serializers.ModelSerializer):
    """
    Transforms system-internal model abstractions directly into clean JSON payloads.
    Guarantees structural validity of incoming fields during creation mutations.
    """
    class Meta:
        model = MusicVibeItem
        fields = ['id', 'artist', 'track', 'mood', 'color']
        read_only_fields = ['id']

    def validate_artist(self, value):
        if not value.strip():
            raise serializers.ValidationError("Artist name token details cannot be empty.")
        return value.strip()

    def validate_track(self, value):
        if not value.strip():
            raise serializers.ValidationError("Track composition title cannot be empty.")
        return value.strip()
    


 
from rest_framework import serializers
from .models import Task
 
class TaskSerializer(serializers.ModelSerializer):
    # Expose camelCase to match frontend field names
    dueDate   = serializers.DateField(source='due_date')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
 
    class Meta:
        model  = Task
        fields = ['id', 'text', 'dueDate', 'completed', 'createdAt']
 
    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Task text cannot be empty.")
        return value.strip()
 
