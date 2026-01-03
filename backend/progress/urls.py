from django.urls import path
from . import views

urlpatterns = [
    # Module Progress
    path('all/', views.get_all_progress, name='get_all_progress'),
    path("performance-event/", views.record_lexical_performance,
         name="performance-event"),
    path("lexical-difficulties/", views.get_lexical_difficulties,
         name="lexical_difficulties"),
    path('<str:module_name>/', views.get_module_progress,
         name='get_module_progress'),

    # Exercise Progress
    path('<str:module_name>/<str:exercise_type>/update/',
         views.update_exercise_progress,
         name='update_exercise_progress'),

    path('<str:module_name>/<str:exercise_type>/history/',
         views.get_performance_history,
         name='get_performance_history'),

    # Reset Progress
    path('reset/all/', views.reset_progress, name='reset_all_progress'),
    path('<str:module_name>/reset/', views.reset_progress,
         name='reset_module_progress'),

    # SRS Endpoints
    path('srs/all/', views.get_srs_cards, name='get_srs_cards'),
    path('srs/due/', views.get_due_srs_cards, name='get_due_srs_cards'),
    path('srs/<int:word_id>/update/',
         views.update_srs_card, name='update_srs_card'),
    path('srs/<int:word_id>/reset/', views.reset_srs_card, name='reset_srs_card'),

    # Review Deck Endpoints
    path('review-deck/', views.get_review_deck, name='get_review_deck'),
    path('review-deck/<int:word_id>/add/',
         views.add_to_review_deck, name='add_to_review_deck'),
    path('review-deck/<int:word_id>/remove/',
         views.remove_from_review_deck, name='remove_from_review_deck'),
    path('review-deck/<int:word_id>/update/',
         views.update_review_deck_item, name='update_review_deck_item'),
    path('review-deck/clear/', views.clear_review_deck, name='clear_review_deck'),
]
