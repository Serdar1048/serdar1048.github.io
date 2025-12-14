import streamlit as st
import joblib
import pandas as pd
import numpy as np
import os

# Sayfa Ayarları
st.set_page_config(
    page_title="Kırmızı Şarap Kalite Tahmincisi",
    page_icon="🍷",
    layout="centered"
)

# Başlık ve Açıklama
st.title("🍷 Kırmızı Şarap Kalitesi Tahminleme v1.4")
st.write("""
Bu uygulama, şarabın kimyasal özelliklerine dayanarak kalitesini tahmin eder.
Lütfen aşağıdaki değerleri girin ve **Tahmin Et** butonuna basın.
""")

# İpucu Köşesi
with st.sidebar:
    st.header("💡 İpuçları")
    st.info("""
    **İyi Şarap (Good) İçin Genellikle:**
    - **Alcohol:** Yüksek olmalı (> 11.5)
    - **Volatile Acidity:** Düşük olmalı (< 0.5)
    - **Sulphates:** Yüksek olmalı (> 0.7)
    - **Citric Acid:** Orta/Yüksek (> 0.3)
    """)
    st.warning("""
    **Not:** Model, gerçek veri setindeki >6 puan alan şarapları "İyi" olarak sınıflandırır. Bu standartlara ulaşmak zordur.
    """)

# Model Yükleme (Hata Yönetimi ve Absolute Path ile)
@st.cache_resource
def load_model():
    try:
        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'model.pkl')
        return joblib.load(model_path)
    except FileNotFoundError:
        st.error(f"Model dosyası bulunamadı: model.pkl. Lütfen önce 'train_model.py' dosyasını çalıştırın.")
        return None

model = load_model()

if model:
    # Kullanıcı Girdi Formu
    with st.form("prediction_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            fixed_acidity = st.slider("Fixed Acidity", 4.0, 16.0, 8.0, 0.1)
            volatile_acidity = st.slider("Volatile Acidity", 0.1, 2.0, 0.5, 0.01)
            citric_acid = st.slider("Citric Acid", 0.0, 1.0, 0.25, 0.01)
            residual_sugar = st.slider("Residual Sugar", 0.0, 16.0, 2.5, 0.1)
            chlorides = st.slider("Chlorides", 0.0, 0.7, 0.08, 0.001)
            
        with col2:
            free_sulfur_dioxide = st.slider("Free Sulfur Dioxide", 1.0, 72.0, 15.0, 1.0)
            total_sulfur_dioxide = st.slider("Total Sulfur Dioxide", 6.0, 289.0, 46.0, 1.0)
            density = st.slider("Density", 0.99, 1.01, 0.996, 0.0001)
            pH = st.slider("pH", 2.0, 5.0, 3.3, 0.01)
            sulphates = st.slider("Sulphates", 0.0, 2.0, 0.65, 0.01)
            alcohol = st.slider("Alcohol", 8.0, 15.0, 10.0, 0.1)

        submitted = st.form_submit_button("Tahmin Et")

    if submitted:
        input_data = pd.DataFrame([[
            fixed_acidity, volatile_acidity, citric_acid, residual_sugar,
            chlorides, free_sulfur_dioxide, total_sulfur_dioxide, density,
            pH, sulphates, alcohol
        ]], columns=[
            'fixed acidity', 'volatile acidity', 'citric acid', 'residual sugar',
            'chlorides', 'free sulfur dioxide', 'total sulfur dioxide', 'density',
            'pH', 'sulphates', 'alcohol'
        ])

        # Tahmin Yap
        prediction = model.predict(input_data)
        probability = model.predict_proba(input_data)

        # Sonucu Göster
        st.markdown("---")
        st.subheader("Tahmin Sonucu")
        
        quality = "İyi Kalite (Good)" if prediction[0] == 1 else "Ortalama/Düşük Kalite (Bad)"
        color = "green" if prediction[0] == 1 else "red"
        
        st.markdown(f"### Tahmin: <span style='color:{color}'>{quality}</span>", unsafe_allow_html=True)
        
        # Olasılık Grafiği
        st.write("Olasılık Dağılımı:")
        prob_df = pd.DataFrame(probability, columns=['Kötü', 'İyi'])
        st.bar_chart(prob_df.T)
