# 🎨 Redis Hybrid Persistence Mode - Görselleştirme Araçları

Bu klasör, Redis Hybrid Persistence Mode'u görselleştirmek için web dashboard ve Python scriptleri içerir.

## 📋 İçindekiler

1. [Web Dashboard](#web-dashboard)
2. [Python Görselleştirme](#python-görselleştirme)
3. [API Server](#api-server)

---

## 🌐 Web Dashboard

### Kurulum ve Çalıştırma

```bash
# 1. Node.js bağımlılıklarını yükle
npm install

# 2. API server'ı başlat
npm start

# 3. Tarayıcıda aç
# dashboard.html dosyasını tarayıcıda açın
# veya: python -m http.server 8080
```

### Özellikler

- ✅ Real-time persistence metrikleri
- ✅ AOF dosya yapısı görselleştirmesi
- ✅ Performans grafikleri
- ✅ Otomatik yenileme (5 saniyede bir)
- ✅ Modern ve responsive tasarım

---

## 🐍 Python Görselleştirme

### Kurulum

```bash
# Python bağımlılıklarını yükle
pip install -r requirements.txt
```

### Kullanım

```bash
# Durum bilgilerini göster
python visualize.py status

# AOF dosya yapısını görselleştir
python visualize.py structure

# Performans karşılaştırması
python visualize.py performance

# Real-time monitoring (60 saniye)
python visualize.py monitor 60
```

### Çıktılar

- `aof_structure.png` - AOF dosya yapısı görselleştirmesi
- `performance_comparison.png` - Performans karşılaştırma grafiği

---

## 🔌 API Server

API server, web dashboard için Redis verilerini sağlar.

### Endpoints

- `GET /api/redis-info` - Persistence bilgileri
- `GET /api/redis-stats` - Genel istatistikler
- `POST /api/trigger-rewrite` - AOF rewrite tetikle
- `GET /api/health` - Health check

### Örnek Kullanım

```bash
# API server'ı başlat
npm start

# Redis bilgilerini al
curl http://localhost:3000/api/redis-info

# AOF rewrite tetikle
curl -X POST http://localhost:3000/api/trigger-rewrite
```

---

## 🚀 Hızlı Başlangıç

### Senaryo 1: Web Dashboard

```bash
# Terminal 1: API server
cd visualization
npm install
npm start

# Terminal 2: Web server (opsiyonel)
python -m http.server 8080

# Tarayıcıda aç
# http://localhost:8080/dashboard.html
```

### Senaryo 2: Python Scripts

```bash
# Durum kontrolü
python visualize.py status

# Görselleştirme
python visualize.py structure
python visualize.py performance
```

---

## 📊 Görselleştirme Örnekleri

### AOF File Structure

```
┌─────────────────────────────────┐
│   AOF File Structure            │
├─────────────────────────────────┤
│  🔷 RDB Preamble (Binary)       │
│     Size: ~500 KB               │
│  ↓                              │
│  🔷 AOF Commands (Text)         │
│     Size: ~500 KB               │
└─────────────────────────────────┘
```

### Performance Comparison

- **RDB Only**: 2s yükleme, 45MB dosya
- **Hybrid Mode**: 5s yükleme, 55MB dosya
- **AOF Only**: 45s yükleme, 180MB dosya

---

## 🔧 Yapılandırma

### Redis Container Adı

Eğer container adı farklıysa, scriptlerde değiştirin:

```python
# visualize.py
visualizer = RedisVisualizer(container='your-container-name')
```

```javascript
// api-server.js
const container = 'your-container-name';
```

---

## 📝 Notlar

- Web dashboard için API server çalışıyor olmalı
- Python scriptleri doğrudan Docker'a bağlanır
- Görselleştirmeler PNG formatında kaydedilir
- Real-time monitoring için matplotlib gerekir

---

## 🐛 Sorun Giderme

### API Server bağlanamıyor

```bash
# Container'ın çalıştığını kontrol et
docker ps | grep redis-hybrid

# Container adını kontrol et
docker ps --format "{{.Names}}"
```

### Python scriptleri çalışmıyor

```bash
# Bağımlılıkları kontrol et
pip list | grep matplotlib

# Docker erişimini kontrol et
docker exec redis-hybrid redis-cli PING
```

---

## 📚 Daha Fazla Bilgi

- Ana dokümantasyon: `../README.md`
- Detaylı açıklama: `../HYBRID_PERSISTENCE_EXPLAINED.md`
- Mimari: `../ARCHITECTURE.md`

