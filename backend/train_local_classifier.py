import pandas as pd
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# 1. Load the data
DATA_PATH = "lead_training_data.csv"
MODEL_PATH = "lead_classifier_model.joblib"

if not os.path.exists(DATA_PATH):
    print(f"Dataset not found at {DATA_PATH}. Creating a basic one...")
    # (The write_to_file tool already created it, but this is a safety check)
    pass

df = pd.read_csv(DATA_PATH)

# Basic cleaning: remove quotes if any
df['text'] = df['text'].str.strip('"')

# 2. Build the pipeline
# Using TfidfVectorizer with bigrams (ngram_range=(1,2)) to capture phrases like "looking for"
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
    ('clf', LogisticRegression(C=10.0)) # Higher C for better fit on small dataset
])

# 3. Train the model
print(f"Training on {len(df)} examples...")
pipeline.fit(df['text'], df['label'])

# 4. Save the model
joblib.dump(pipeline, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")

# 5. Test with a couple of examples
test_texts = [
    "I am looking for a shopify expert to help me scale my store",
    "just sharing some tips on web design",
    "need help with an app build"
]
preds = pipeline.predict(test_texts)
probs = pipeline.predict_proba(test_texts).max(axis=1)

for t, p, pr in zip(test_texts, preds, probs):
    print(f"Text: {t[:50]}... -> Prediction: {p} (Prob: {pr:.2f})")
