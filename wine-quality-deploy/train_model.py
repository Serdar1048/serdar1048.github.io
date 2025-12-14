import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# 1. Veri Setini Yükle
url = "https://archive.ics.uci.edu/ml/machine-learning-databases/wine-quality/winequality-red.csv"

print("Veri seti indiriliyor...")
try:
    df = pd.read_csv(url, sep=';')
except Exception as e:
    print(f"Veri indirilemedi, rastgele veri oluşturuluyor... Hata: {e}")
    # Fallback: Rastgele veri oluştur
    data = np.random.rand(100, 11) * 10
    columns = ['fixed acidity', 'volatile acidity', 'citric acid', 'residual sugar',
               'chlorides', 'free sulfur dioxide', 'total sulfur dioxide', 'density',
               'pH', 'sulphates', 'alcohol']
    df = pd.DataFrame(data, columns=columns)
    df['quality'] = np.random.randint(3, 9, 100)

# 2. Ön İşleme
df['quality_bin'] = df['quality'].apply(lambda x: 1 if x > 6 else 0)

X = df.drop(['quality', 'quality_bin'], axis=1)
y = df['quality_bin']

# Eğitim/Test Ayrımı
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Model Eğitimi
print("Model eğitiliyor...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 4. Değerlendirme
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Model Doğruluğu: {acc:.2f}")

# 5. Modeli Kaydet
joblib.dump(model, 'model.pkl')
print("Model kaydedildi: model.pkl")
