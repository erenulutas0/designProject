# 🎨 Redis Hybrid Persistence Mode - Görselleştirme (Türkçe)

## 🚀 Hızlı Başlangıç

### Adım 1: API Server'ı Başlat

**Windows için:**
```bash
cd hybrid-persistence\visualization
start-api.bat
```

**Manuel olarak:**
```bash
cd hybrid-persistence\visualization
npm install
npm start
```

API server `http://localhost:3000` adresinde çalışacak.

### Adım 2: Dashboard'u Aç

1. `dashboard.html` dosyasına çift tıklayın
2. Veya tarayıcıda açın: `file:///path/to/dashboard.html`

### Adım 3: Kullanım

- Dashboard otomatik olarak 5 saniyede bir yenilenir
- "🔄 Yenile" butonuna tıklayarak manuel yenileme yapabilirsiniz
- API server çalışmıyorsa hata mesajı gösterilir

---

## ⚠️ Sorun Giderme

### "404 Not Found" Hatası

Bu hata, API server'ın çalışmadığı anlamına gelir.

**Çözüm:**
1. Yeni bir terminal açın
2. Şu komutu çalıştırın:
   ```bash
   cd hybrid-persistence\visualization
   npm install
   npm start
   ```
3. API server başladıktan sonra dashboard'u yenileyin

### "Cannot connect to Redis" Hatası

Redis container'ı çalışmıyor olabilir.

**Çözüm:**
```bash
# Container'ı başlat
cd hybrid-persistence
docker-compose up -d redis-hybrid

# Container'ın çalıştığını kontrol et
docker ps | grep redis-hybrid
```

### API Server Başlamıyor

**Kontrol edin:**
1. Node.js yüklü mü? `node --version`
2. Port 3000 kullanımda mı? Başka bir uygulama kullanıyor olabilir
3. Dependencies yüklü mü? `npm install` çalıştırın

---

## 📊 Dashboard Özellikleri

### 1. Status Kartı
- AOF Enabled durumu
- RDB Preamble durumu
- Rewrite işlemi durumu

### 2. Persistence Metrics
- AOF Current Size
- AOF Base Size (RDB preamble boyutu)
- AOF File Size
- Last Save Time

### 3. AOF File Structure
- RDB Preamble bölümü (mavi)
- AOF Commands bölümü (yeşil)
- Görsel yapı gösterimi

### 4. Performance Chart
- Zaman içinde AOF boyutu değişimi
- Real-time grafik

---

## 🐍 Python Görselleştirme

### Kurulum

```bash
pip install matplotlib numpy
```

### Kullanım

```bash
cd hybrid-persistence\visualization

# Durum bilgileri
python visualize.py status

# AOF yapısı görselleştirmesi (PNG dosyası oluşturur)
python visualize.py structure

# Performans karşılaştırması
python visualize.py performance

# Real-time monitoring (60 saniye)
python visualize.py monitor 60
```

---

## 📝 Notlar

- API server çalışmıyorsa dashboard hata mesajı gösterir
- Gerçek veriler için API server çalışıyor olmalı
- Dashboard tarayıcıda açılmalı (file:// protokolü ile)
- CORS sorunları için API server'ın çalışıyor olması gerekir

---

## 🔧 Gelişmiş Kullanım

### API Endpoints

API server çalışırken şu endpoint'ler kullanılabilir:

- `GET http://localhost:3000/api/redis-info` - Persistence bilgileri
- `GET http://localhost:3000/api/redis-stats` - Genel istatistikler
- `POST http://localhost:3000/api/trigger-rewrite` - AOF rewrite tetikle
- `GET http://localhost:3000/api/health` - Health check

### Örnek Kullanım

```bash
# API server çalışırken
curl http://localhost:3000/api/redis-info

# AOF rewrite tetikle
curl -X POST http://localhost:3000/api/trigger-rewrite
```

---

## 💡 İpuçları

1. **İlk kullanım:** Önce API server'ı başlatın, sonra dashboard'u açın
2. **Hata durumu:** API server olmadan dashboard hata mesajı gösterir
3. **Real-time:** API server çalışırken dashboard otomatik yenilenir
4. **Python:** Python scriptleri API server'a ihtiyaç duymaz, doğrudan Docker'a bağlanır

---

## 🆘 Yardım

Sorun yaşıyorsanız:

1. API server loglarını kontrol edin
2. Docker container'ın çalıştığını kontrol edin: `docker ps`
3. Port 3000'in kullanılabilir olduğunu kontrol edin
4. Browser console'da hataları kontrol edin (F12)

