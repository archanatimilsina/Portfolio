from django.db import models
import os
import uuid

class ProfessionalDevelopment(models.Model):
    DEVELOPMENT_TYPES = [
        ('Mentorship', 'Mentorship'),
        ('Internship', 'Internship'),
        ('Course', 'Course'),
        ('Fellowship', 'Fellowship'),
        ('Session', 'Session'),
        ('Online Course', 'Online Course'),
    ]
    
    name = models.CharField(
        max_length=50, 
        choices=DEVELOPMENT_TYPES,
    )
    
    subject = models.CharField(
        max_length=200,
    )
    company = models.CharField(
        max_length=100,
    )
    duration = models.CharField(
        max_length=100,  
    )
    certificate_image = models.ImageField(
    upload_to='certificates/',
    blank=True,
    null=True,
)
    
    learnings = models.JSONField(
        default=list,
        blank=True,
   )
    skills_acquired = models.JSONField(
        default=list,
        blank=True,
    )
    
    class Meta:
        verbose_name = "Professional Development"

    def __str__(self):
        return f"{self.name} in {self.subject} at {self.company}"
    

class Project(models.Model):
    PROJECT_TYPES = [
        ('solo', 'Solo'),
        ('group', 'Group'),
        ('academic', 'Academic'),
        ('open_source', 'Open Source'),
    ]

    name = models.CharField(
        max_length=100, 
        unique=True,
    )
    tech = models.CharField(
        max_length=150,
    )
    project_type = models.CharField(
        max_length=50,
        choices=PROJECT_TYPES,
        default='solo',
    )
    description = models.TextField(
        blank=True, 
        null=True,
    )
    tech_stack = models.JSONField(
        default=dict,
        blank=True,
        help_text="Categorized object mapping arrays of languages, frameworks, and tools."
    )
    features = models.JSONField(
        default=list,
        blank=True,
    )
    github_link = models.URLField(
        max_length=500,
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ['-created_at']  

    def __str__(self):
        return self.name
    



class AboutMe(models.Model):
    name = models.CharField(
        max_length=255, 
        verbose_name="Operative Name / Codename",
        help_text="e.g., Alex 'Wraith' Johnson"
    )
    email = models.EmailField(
        unique=True, 
        verbose_name="Secure Email Protocol"
    )
    phone = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="Encrypted Communication Line"
    )
    address = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Base Location / Physical Address"
    )

    base_secret_code = models.CharField(
        max_length=4, 
        verbose_name="Base Secret Code",
        help_text="e.g., 8888"
    )
    sidebar_code = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Sidebar Sequential Code"
    )
    portal_dream = models.TextField(
        verbose_name="Dream / Vision for Secret Portal"
    )

    clearance_level = models.CharField(
        max_length=50, 
        default="ALPHA-9",
        verbose_name="Clearance Level"
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Transmission Timestamp"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.clearance_level})"
    



class DayLog(models.Model):
    MOOD_CHOICES = [
        ('Happy', 'Happy'),
        ('Okay', 'Okay'),
        ('Neutral', 'Neutral'),
        ('Sad', 'Sad'),
        ('Wired', 'Wired'),
        ('Tired', 'Tired'),
    ]

    SOURCE_CHOICES = [
        ('local', 'Local'),
        ('remote', 'Remote'),
    ]

    date = models.DateField(
    )
    mood = models.CharField(
        max_length=15, 
        choices=MOOD_CHOICES, 
        default='Neutral',
    )
    title = models.CharField(
        max_length=255,
    )
    
    # Dual-Channel Image Handling
    image_file = models.ImageField(
        upload_to='scrapbook/days/', 
        blank=True, 
        null=True,
    )
    remote_url = models.URLField(
        max_length=1000, 
        blank=True, 
        null=True,
    )
    source = models.CharField(
        max_length=10, 
        choices=SOURCE_CHOICES, 
        default='remote',
  
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.date}] {self.title[:30]} ({self.mood})"
    

def scrapbook_upload_path(instance, filename):
    """
    Creates a unique upload path for images.
    e.g., media/scrapbook/550e8400-e29b/filename.jpg
    """
    ext = filename.split('.')[-1]
    # create unique filename using UUID
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('scrapbook', filename)

class ScrapbookStamp(models.Model):
    SOURCE_CHOICES = [
        ('local', 'Local Upload'),
        ('remote', 'Remote URL'),
    ]

    title = models.CharField(max_length=255, verbose_name="Memory Label")
    
    image = models.ImageField(
        upload_to=scrapbook_upload_path, 
        verbose_name="Archived Image"
    )
    
    remote_url = models.URLField(max_length=1000, blank=True, null=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='local')
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return self.title


from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=ScrapbookStamp)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem
    when corresponding `ScrapbookStamp` object is deleted.
    """
    if instance.image:
        if os.path.isfile(instance.image.path):
            os.remove(instance.image.path)




from django.db import models
from django.utils.translation import gettext_lazy as _

class OperativeNote(models.Model):
    """
    Stores private thought streams, Reminders, and Intentions that
    read cleanly like a narrative. Avoids premature structural abstraction.
    """
    # Maps to runtime `emoji` tracker. Max length 10 to robustly store
    # multi-byte high-definition emojis if necessary.
    emoji = models.CharField(
        _("thought node emoji"),
        max_length=10, 
        default="📝", 
        blank=True,
        help_text="Visual identifier for quick model convergence."
    )
    
    # Maps to runtime `title` field. The "Note Subject".
    title = models.CharField(
        _("note subject title"),
        max_length=255, 
        help_text="Decoupled from enterprise mechanics."
    )
    
    # Maps to runtime `text` field. "The stuff that doesn't go in the commit message".
    text = models.TextField(
        _("internal thought stream"),
        help_text="Vectorized narrative structure. Keep it decoupled."
    )
    
    # Audit fields for runtime systemheavy-lifting convergence
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_("data Matrix insertion time")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("matrix matrix mutation time")
    )

    class Meta:
        ordering = ['-created_at'] # Show newest first for high data throughput

    def __str__(self):
        return f"{self.emoji} {self.title} (Inserted: {self.created_at.date()})"
    


from django.db import models

class DreamWish(models.Model):
    """
    Represents an item in the user's Wish List.
    'Things I write to myself. Not needs. Pure wants.'
    """
    # Maps to frontend 'emoji'. Emojis can take up to 4 bytes per character.
    # set to max_length=10 to safely accommodate multi-byte emojis and a default.
    emoji = models.CharField(
        max_length=10, 
        default="✨", 
        blank=True,
        help_text="A visual representation of the dream."
    )
    
    # Maps to frontend 'wish'.
    # TextField is used instead of CharField to allow for long, detailed daydreams.
    wish = models.TextField(
        help_text="Description of the daydream or desired object."
    )
    
    # Added metadata for sorting, useful for the frontend recursivity.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Default sort: newest first, similar to the React state logic ([addedItem, ...wishes])
        ordering = ['-created_at']

    def __str__(self):
        # Returns a truncated version of the wish for the admin interface
        truncated_wish = (self.wish[:50] + '..') if len(self.wish) > 50 else self.wish
        return f"{self.emoji} - {truncated_wish}"
    

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class WatchlistItem(models.Model):
    # Mapping TYPE_OPT from frontend
    TYPE_CHOICES = [
        ('drama', 'Drama'),
        ('movie', 'Movie'),
        ('anime', 'Anime'),
    ]

    # Mapping STATUS_OPT from frontend
    STATUS_CHOICES = [
        ('Watching', 'Watching'),
        ('Finished', 'Finished'),
        ('Plan to Watch', 'Plan to Watch'),
        ('On Hold', 'On Hold'),
        ('Dropped', 'Dropped'),
    ]

    # Mapping GENRE_OPT from frontend
    GENRE_CHOICES = [
        ('Slice of Life', 'Slice of Life'),
        ('Romance', 'Romance'),
        ('Thriller', 'Thriller'),
        ('Action', 'Action'),
        ('Drama', 'Drama'),
        ('Fantasy', 'Fantasy'),
        ('Historical', 'Historical'),
        ('Crime/Dark Comedy', 'Crime/Dark Comedy'),
        ('Romance/Fantasy', 'Romance/Fantasy'),
        ('Horror/Action', 'Horror/Action'),
        ('Action/Superhero', 'Action/Superhero'),
        ('Action/Dark', 'Action/Dark'),
        ('Romance/Music', 'Romance/Music'),
        ('Drama/Fantasy', 'Drama/Fantasy'),
        ('Adventure/Fantasy', 'Adventure/Fantasy'),
        ('Sci-Fi', 'Sci-Fi'),
        ('Comedy', 'Comedy'),
    ]

    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='drama')
    title = models.CharField(max_length=255)
    genre = models.CharField(max_length=50, choices=GENRE_CHOICES)
    
    # Matches min="1990" max="2030" attributes from your HTML form input
    year = models.IntegerField(
        validators=[MinValueValidator(1990), MaxValueValidator(2030)],
        blank=True,
        null=True
    )
    
    # Matches min="1" attribute from your HTML form input
    episodes = models.IntegerField(
        validators=[MinValueValidator(1)],
        blank=True,
        null=True
    )
    
    # Matches your star matrix row limit (1-10)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Plan to Watch')
    
    # Custom emojis can consume up to 4 bytes per character. 
    # Setting max_length=16 accommodates compound characters easily.
    emoji = models.CharField(max_length=16, default='🎬')
    
    # Corresponds to FormTextarea component field
    note = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.emoji} {self.title} ({self.type})"
    

from django.db import models
from django.utils.translation import gettext_lazy as _

class OperativeGoal(models.Model):
    """
    Stores dreams, intentions, and checkboxes within the living list 
    data flow pipeline.
    """
    # Maps to frontend `emoji` tracker. Emojis can be multi-byte.
    # set to max_length=10 to safely accommodate standard emojis.
    emoji = models.CharField(
        _("goal emoji visual identifier"),
        max_length=10, 
        default="🎯", 
        blank=True,
        help_text="A visual representation of the dream/vision."
    )
    
    # Maps to frontend `title` field. The objective text.
    title = models.CharField(
        _("objective description title"),
        max_length=255, 
        help_text="What are you building or working toward?"
    )
    
    timeline = models.CharField(
        _("projected chronological timeframe"),
        max_length=100,
        help_text="e.g. Q4 2026 / Ongoing / master system design 2025"
    )
    
    done = models.BooleanField(
        _("completion status flag"),
        default=False,
        help_text="Ticks the goal item if finalized."
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_("system generation ingestion time")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("matrix mutation timeline conversion")
    )

    class Meta:
        ordering = ['done', '-created_at'] 

    def __str__(self):
        status = "✓" if self.done else "×"
        return f"[{status}] {self.emoji} {self.title} (Inserted: {self.created_at.date()})"
    

from django.db import models

class HobbyItem(models.Model):
    emoji = models.CharField(
        max_length=12, 
        default="✨", 
        blank=True,
        help_text="Unicode icon character or visual element label string."
    )
    
    title = models.CharField(
        max_length=150,
        help_text="Clear label naming structural category e.g., Photography."
    )
    
    # Matches high-capacity textual field description mapping block
    text = models.TextField(
        help_text="Detailed analytical insight framing execution parameters or core personal metrics."
    )
    
    # Non-mutating sequence sorting parameters automatically tracked by Django core engines
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.emoji} {self.title}"
    


from django.db import models
from django.core.validators import RegexValidator

class MusicVibeItem(models.Model):

    artist = models.CharField(
        max_length=150,
    )
    
    track = models.CharField(
        max_length=200,
    )
    
    mood = models.CharField(
        max_length=255,
    )
    

    color_validator = RegexValidator(
        regex=r'^#(?:[0-9a-fA-F]{3}){1,2}$',
        message="Color must be a valid hex color string (e.g., #6366f1)."
    )
    
    color = models.CharField(
        max_length=7,
        validators=[color_validator],
        default="#10b981",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.artist} - {self.track} ({self.color})"
    





from django.db import models

class Task(models.Model):
    text       = models.CharField(max_length=500)
    due_date   = models.DateField()
    completed  = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = "✓" if self.completed else "○"
        return f"[{status}] {self.text[:60]} ({self.due_date})"