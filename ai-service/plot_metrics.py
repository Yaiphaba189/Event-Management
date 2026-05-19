import pickle
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Apply seaborn style for a modern, sleek look
sns.set_theme(style="whitegrid", context="talk")

model_path = '/Users/yaiphaba/Desktop/All File/Event-Management/ai-service/models/attendance_model.pkl'
with open(model_path, 'rb') as f:
    model = pickle.load(f)

# GradientBoostingRegressor has train_score_ (loss at each iteration)
iterations = np.arange(len(model.train_score_)) + 1

fig, axes = plt.subplots(1, 2, figsize=(16, 7))
fig.patch.set_facecolor('#ffffff')

# Plot 1: Training Loss
axes[0].plot(iterations, model.train_score_, color='#6366f1', linewidth=3)
axes[0].set_title('Model Training Convergence\n(Manipur Univ Dataset)', fontsize=16, fontweight='bold', pad=15)
axes[0].set_xlabel('Boosting Iterations (Trees)', fontsize=14, fontweight='500')
axes[0].set_ylabel('Loss (Mean Squared Error)', fontsize=14, fontweight='500')
axes[0].grid(True, linestyle='--', alpha=0.5)
axes[0].spines['top'].set_visible(False)
axes[0].spines['right'].set_visible(False)
axes[0].tick_params(labelsize=12)

# Plot 2: Feature Importances
features = ['Category', 'Price', 'Capacity', 'Day of Week', 'Online Format']
importances = model.feature_importances_
indices = np.argsort(importances)

# Use a gradient-like color palette for importances
colors = sns.color_palette("viridis", len(features))
colors = [colors[i] for i in range(len(colors))]

axes[1].barh(range(len(indices)), importances[indices], color='#34d399', align='center', height=0.6)
axes[1].set_yticks(range(len(indices)))
axes[1].set_yticklabels([features[i] for i in indices], fontsize=13, fontweight='500')
axes[1].set_title('Learned Feature Importances', fontsize=16, fontweight='bold', pad=15)
axes[1].set_xlabel('Relative Importance (Weight)', fontsize=14, fontweight='500')
axes[1].spines['top'].set_visible(False)
axes[1].spines['right'].set_visible(False)
axes[1].grid(True, axis='x', linestyle='--', alpha=0.5)

plt.tight_layout(pad=3.0)

# Create the artifacts directory if it doesn't exist
out_dir = '/Users/yaiphaba/.gemini/antigravity/brain/5adbbe74-e9ec-47cb-96cb-ae5bffc67d5c'
os.makedirs(out_dir, exist_ok=True)

out_path = os.path.join(out_dir, 'training_graph.png')
plt.savefig(out_path, dpi=300, bbox_inches='tight', facecolor='#ffffff')
print(f"Saved graph to {out_path}")
