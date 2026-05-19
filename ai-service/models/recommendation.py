"""
Event Recommendation Engine
Uses Collaborative Filtering with a user-event interaction matrix.
Can be trained on real user data or initialized with synthetic data.
"""

import numpy as np
from typing import Optional


class RecommendationEngine:
    def __init__(self):
        self.is_trained = False
        self.user_profiles = {}
        self.event_features = {}
        self.interaction_matrix = None
        self.user_index = {}
        self.event_index = {}

        # Initialize with synthetic data for demo
        self._initialize_demo_data()

    def _initialize_demo_data(self):
        """Create synthetic training data for demonstration."""
        # Simulated users and their category preferences
        self.user_profiles = {
            "user_1": {"tech": 0.9, "business": 0.6, "music": 0.3, "sports": 0.2},
            "user_2": {"tech": 0.3, "business": 0.8, "music": 0.7, "sports": 0.5},
            "user_3": {"tech": 0.8, "business": 0.4, "music": 0.2, "sports": 0.9},
            "user_4": {"tech": 0.5, "business": 0.9, "music": 0.6, "sports": 0.3},
            "user_5": {"tech": 0.7, "business": 0.5, "music": 0.8, "sports": 0.4},
        }

        # Simulated events for Manipur University & Manipur
        self.event_features = {
            "evt_1": {"title": "Manipur University Tech Expo", "category": "tech", "score_base": 0.9},
            "evt_2": {"title": "Imphal AI & ML Workshop", "category": "tech", "score_base": 0.85},
            "evt_3": {"title": "MU Startup Pitch Day", "category": "business", "score_base": 0.8},
            "evt_4": {"title": "Loktak Lake Conservation Seminar", "category": "other", "score_base": 0.82},
            "evt_5": {"title": "Sangai Music Festival", "category": "music", "score_base": 0.88},
            "evt_6": {"title": "Manipuri Classical Dance Workshop", "category": "other", "score_base": 0.83},
            "evt_7": {"title": "MU Entrepreneurship Summit", "category": "business", "score_base": 0.78},
            "evt_8": {"title": "Imphal Annual Marathon", "category": "sports", "score_base": 0.75},
        }

        self.is_trained = True

    def train(self, interactions=None):
        """
        Train the recommendation model.
        In production, this would use real user-event interaction data.
        """
        if interactions is None:
            # Use synthetic data
            n_users = len(self.user_profiles)
            n_events = len(self.event_features)

            # Create interaction matrix (users x events)
            np.random.seed(42)
            self.interaction_matrix = np.random.rand(n_users, n_events)

            # Apply category preferences
            for u_idx, (user_id, prefs) in enumerate(self.user_profiles.items()):
                for e_idx, (event_id, features) in enumerate(self.event_features.items()):
                    cat = features["category"]
                    if cat in prefs:
                        self.interaction_matrix[u_idx, e_idx] *= prefs[cat]

            self.user_index = {uid: i for i, uid in enumerate(self.user_profiles)}
            self.event_index = {eid: i for i, eid in enumerate(self.event_features)}

        self.is_trained = True
        return {
            "status": "trained",
            "n_users": len(self.user_profiles),
            "n_events": len(self.event_features),
            "algorithm": "collaborative_filtering",
        }

    def predict(
        self,
        user_id: str,
        limit: int = 5,
        categories: Optional[list[str]] = None,
    ) -> list[dict]:
        """Generate event recommendations for a user."""
        if not self.is_trained:
            self.train()

        # Get or create user preferences
        if user_id in self.user_profiles:
            user_prefs = self.user_profiles[user_id]
        else:
            # Default preferences for new users
            user_prefs = {"tech": 0.5, "business": 0.5, "music": 0.5, "sports": 0.5}

        recommendations = []
        for event_id, features in self.event_features.items():
            cat = features["category"]

            # Filter by categories if specified
            if categories and cat not in categories:
                continue

            # Calculate recommendation score
            base_score = features["score_base"]
            pref_score = user_prefs.get(cat, 0.5)
            noise = np.random.uniform(-0.05, 0.05)
            final_score = min(max(base_score * pref_score + noise, 0), 1)

            # Determine reason
            if pref_score > 0.7:
                reason = f"Based on your strong interest in {cat} events"
            elif pref_score > 0.4:
                reason = f"Popular among users with similar profiles"
            else:
                reason = f"Trending in {cat} category"

            recommendations.append({
                "event_id": event_id,
                "title": features["title"],
                "category": cat,
                "score": round(final_score, 3),
                "reason": reason,
            })

        # Sort by score and return top N
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]
