from django.db import models
import os
import uuid
from django.core.validators import RegexValidator
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator

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
        ordering = ['created_at']  

    def __str__(self):
        return self.name
    

class AboutMe(models.Model):
    name = models.CharField(
        max_length=255, 
    )
    email = models.EmailField(
        unique=True, 
    )
    phone = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
    )
    address = models.TextField(
        blank=True, 
        null=True, 
    )
    base_secret_code = models.CharField(
        max_length=4, 
    )
    sidebar_code = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
    )
    portal_dream = models.TextField(
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name}"
    
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
    ext = filename.split('.')[-1]
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
    )
    
    remote_url = models.URLField(max_length=1000, blank=True, null=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='local')
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return self.title




@receiver(post_delete, sender=ScrapbookStamp)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    if instance.image:
        if os.path.isfile(instance.image.path):
            os.remove(instance.image.path)





class OperativeNote(models.Model):
    emoji = models.CharField(
        max_length=10, 
        default="📝", 
        blank=True,
    )
    
    title = models.CharField(
        max_length=255, 
    )
    
    text = models.TextField(
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True, 
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ['-created_at'] 

    def __str__(self):
        return f"{self.emoji} {self.title} (Inserted: {self.created_at.date()})"
    



class DreamWish(models.Model):
    emoji = models.CharField(
        max_length=10, 
        default="✨", 
        blank=True,
    )

    wish = models.TextField(
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        truncated_wish = (self.wish[:50] + '..') if len(self.wish) > 50 else self.wish
        return f"{self.emoji} - {truncated_wish}"
    


class WatchlistItem(models.Model):
    TYPE_CHOICES = [
        ('drama', 'Drama'),
        ('movie', 'Movie'),
        ('anime', 'Anime'),
        ('book', 'Book'),
        ('manga', 'Manga'),
    ]

    STATUS_CHOICES = [
        ('Watching', 'Watching'),
        ('Completed', 'Completed'),
        ('Plan to Watch', 'Plan to Watch'),
        ('On Hold', 'On Hold'),
        ('Dropped', 'Dropped'),
    ]

    GENRE_CHOICES = [
        ('Thriller', 'Thriller'),
        ('Romance', 'Romance'),
        ('Action', 'Action'),
        ('Drama', 'Drama'),
        ('Fantasy', 'Fantasy'),
        ('BL', 'BL'),
        ('Horror', 'Horror'),
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Plan to Watch')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.type})"



class OperativeGoal(models.Model):
    title = models.CharField(max_length=255)
    timeline = models.PositiveIntegerField()
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['done', '-created_at']

    def __str__(self):
        status = "✓" if self.done else "×"
        return f"[{status}] {self.title} (Inserted: {self.created_at.date()})"

    @property
    def days_completed(self):
        return self.day_statuses.filter(done=True).count()

    def sync_day_statuses(self):
        existing_days = set(
            self.day_statuses.values_list('day_number', flat=True)
        )
        target_days = set(range(1, self.timeline + 1))

        to_add = target_days - existing_days
        to_remove = existing_days - target_days

        if to_add:
            GoalDayStatus.objects.bulk_create([
                GoalDayStatus(goal=self, day_number=d) for d in to_add
            ])
        if to_remove:
            self.day_statuses.filter(day_number__in=to_remove).delete()

    def sync_done_status(self):
        completed = self.days_completed
        new_done = self.timeline > 0 and completed >= self.timeline
        if new_done != self.done:
            self.done = new_done
            self.save(update_fields=['done'])

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            GoalDayStatus.objects.bulk_create([
                GoalDayStatus(goal=self, day_number=i)
                for i in range(1, self.timeline + 1)
            ])
        else:
            self.sync_day_statuses()


class GoalDayStatus(models.Model):
    goal = models.ForeignKey(
        OperativeGoal,
        related_name='day_statuses',
        on_delete=models.CASCADE,
    )
    day_number = models.PositiveIntegerField()
    done = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_number']
        unique_together = ('goal', 'day_number')

    def __str__(self):
        return f"{self.goal.title} · Day {self.day_number} · {'done' if self.done else 'not done'}"

class HobbyItem(models.Model):
    emoji = models.CharField(
        max_length=12, 
        default="✨", 
        blank=True,
    )
    
    title = models.CharField(
        max_length=150,
    )
    
    text = models.TextField(
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.emoji} {self.title}"
    



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