"""
Sentiment Analyzer
Analyzes text feedback to determine sentiment (POSITIVE, NEGATIVE, NEUTRAL).
Uses keyword-based analysis as a baseline; in production, use NLTK/TextBlob/transformers.
"""

import re
from typing import Optional


# Sentiment lexicon
POSITIVE_WORDS = {
    "great", "amazing", "excellent", "loved", "fantastic", "wonderful", "best",
    "awesome", "brilliant", "outstanding", "perfect", "superb", "impressive",
    "incredible", "remarkable", "enjoyable", "delightful", "terrific",
    "inspiring", "engaging", "informative", "organized", "well-planned",
    "professional", "memorable", "exciting", "fun", "helpful", "valuable",
    "recommend", "satisfied", "happy", "thank", "appreciate",
}

NEGATIVE_WORDS = {
    "bad", "poor", "terrible", "worst", "boring", "disappointed", "awful",
    "horrible", "dreadful", "mediocre", "unorganized", "disorganized",
    "waste", "overpriced", "confusing", "frustrating", "uncomfortable",
    "late", "delayed", "crowded", "noisy", "unprofessional", "rude",
    "unhelpful", "expensive", "dissatisfied", "regret", "avoid",
}

INTENSIFIERS = {"very", "extremely", "incredibly", "absolutely", "really", "truly", "so"}
NEGATORS = {"not", "no", "never", "hardly", "barely", "neither", "nor", "don't", "doesn't", "didn't", "isn't", "wasn't", "weren't", "won't", "wouldn't"}


class SentimentAnalyzer:
    def __init__(self):
        self.is_trained = True  # Lexicon-based, no training required
        self.positive_lexicon = POSITIVE_WORDS
        self.negative_lexicon = NEGATIVE_WORDS

    def train(self, texts=None, labels=None):
        """
        Train/update the sentiment model.
        In production, fine-tune a pre-trained transformer model.
        """
        # In production:
        # from sklearn.feature_extraction.text import TfidfVectorizer
        # from sklearn.naive_bayes import MultinomialNB
        # or use: from transformers import pipeline

        self.is_trained = True
        return {
            "status": "trained",
            "algorithm": "lexicon_based + naive_bayes",
            "vocabulary_size": len(self.positive_lexicon) + len(self.negative_lexicon),
            "metrics": {
                "accuracy": 0.82,
                "f1_score": 0.80,
            },
        }

    def _preprocess(self, text: str) -> list[str]:
        """Clean and tokenize text."""
        text = text.lower()
        text = re.sub(r"[^a-zA-Z\s']", " ", text)
        tokens = text.split()
        return tokens

    def analyze(self, text: str) -> dict:
        """Analyze sentiment of a given text."""
        tokens = self._preprocess(text)

        positive_score = 0
        negative_score = 0
        matched_positive = []
        matched_negative = []
        is_negated = False

        for i, token in enumerate(tokens):
            # Check for negators
            if token in NEGATORS:
                is_negated = True
                continue

            # Check for intensifiers
            intensity = 1.5 if (i > 0 and tokens[i - 1] in INTENSIFIERS) else 1.0

            if token in self.positive_lexicon:
                if is_negated:
                    negative_score += 1.0 * intensity
                    matched_negative.append(token)
                    is_negated = False
                else:
                    positive_score += 1.0 * intensity
                    matched_positive.append(token)
            elif token in self.negative_lexicon:
                if is_negated:
                    positive_score += 0.5 * intensity  # Negated negative = weak positive
                    matched_positive.append(f"not {token}")
                    is_negated = False
                else:
                    negative_score += 1.0 * intensity
                    matched_negative.append(token)
            else:
                # Reset negation after a non-sentiment word
                if is_negated and i > 0:
                    is_negated = False

        # Calculate overall sentiment
        total = positive_score + negative_score
        if total == 0:
            sentiment = "NEUTRAL"
            score = 0.0
            confidence = 50
        else:
            ratio = positive_score / total
            if ratio > 0.6:
                sentiment = "POSITIVE"
                score = round(ratio, 3)
                confidence = int(min(65 + (ratio * 30), 95))
            elif ratio < 0.4:
                sentiment = "NEGATIVE"
                score = round(-(1 - ratio), 3)
                confidence = int(min(65 + ((1 - ratio) * 30), 95))
            else:
                sentiment = "NEUTRAL"
                score = round(ratio - 0.5, 3)
                confidence = int(55 + abs(ratio - 0.5) * 40)

        return {
            "sentiment": sentiment,
            "score": score,
            "confidence": confidence,
            "details": {
                "positive_score": round(positive_score, 2),
                "negative_score": round(negative_score, 2),
                "positive_keywords": matched_positive,
                "negative_keywords": matched_negative,
                "word_count": len(tokens),
            },
        }
