# 🔄 Tam Yeniden Başlatma Kılavuzu

## 🧹 Cache Temizleme ve Yeniden Başlatma

### Adım 1: Docker Container'ları Temizle

```powershell
cd hybrid-persistence
docker-compose down -v
docker-compose up -d redis-hybrid
```

### Adım 2: Redis Yapılandırması

```powershell
# Redis'in hazır olmasını bekle (3-5 saniye)
Start-Sleep -Seconds 5

# Hybrid mode'u etkinleştir
docker exec redis-hybrid redis-cli CONFIG SET aof-use-rdb-preamble yes

# Test verisi ekle
docker exec redis-hybrid redis-cli SET test:key "Hybrid Mode Test"

# AOF rewrite tetikle (RDB preamble oluştur)
docker exec redis-hybrid redis-cli BGREWRITEAOF

# 2-3 saniye bekle
Start-Sleep -Seconds 3

# Kontrol et
docker exec redis-hybrid sh -c "ls -lh /data/appendonlydir/"
```

### Adım 3: API Server'ı Yeniden Başlat

**Yöntem 1: Otomatik Script (Önerilen)**
```powershell
cd hybrid-persistence\visualization
.\restart-all.bat
```

**Yöntem 2: Manuel**
```powershell
# Port 3000'i kullanan process'i kapat
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F

# API server'ı başlat
cd hybrid-persistence\visualization
npm start
```

### Adım 4: Tarayıcı Cache'ini Temizle

**Chrome/Edge:**
1. `Ctrl + Shift + Delete` tuşlarına bas
2. "Cached images and files" seçeneğini işaretle
3. "Clear data" butonuna tıkla
4. Veya `Ctrl + Shift + R` (Hard Refresh)

**Firefox:**
1. `Ctrl + Shift + Delete` tuşlarına bas
2. "Cache" seçeneğini işaretle
3. "Clear Now" butonuna tıkla
4. Veya `Ctrl + F5` (Hard Refresh)

**Veya Developer Tools ile:**
1. `F12` tuşuna bas (Developer Tools)
2. Network sekmesine git
3. "Disable cache" checkbox'ını işaretle
4. Sayfayı yenile (`F5`)

### Adım 5: Dashboard'u Aç

1. Tarayıcıda aç: `http://localhost:3000/`
2. Hard refresh yap: `Ctrl + Shift + R`
3. Console'u kontrol et: `F12` → Console sekmesi

## ✅ Kontrol Listesi

- [ ] Redis container çalışıyor mu? (`docker ps | findstr redis-hybrid`)
- [ ] API server çalışıyor mu? (`curl http://localhost:3000/api/health`)
- [ ] AOF dosyaları oluştu mu? (`docker exec redis-hybrid sh -c "ls /data/appendonlydir/"`)
- [ ] RDB preamble var mı? (`docker exec redis-hybrid sh -c "cat /data/appendonlydir/appendonly.aof.manifest"`)
- [ ] Dashboard verileri gösteriyor mu?

## 🔍 Sorun Giderme

### API Server Başlamıyor
```powershell
# Port kontrolü
netstat -ano | findstr :3000

# Process'i kapat
taskkill /PID <PID> /F

# Yeniden başlat
cd hybrid-persistence\visualization
npm start
```

### Redis Container Çalışmıyor
```powershell
# Container'ı kontrol et
docker ps -a | findstr redis-hybrid

# Logları kontrol et
docker logs redis-hybrid

# Yeniden başlat
cd hybrid-persistence
docker-compose up -d redis-hybrid
```

### Dashboard Veri Göstermiyor
1. Browser console'u kontrol et (`F12`)
2. Network sekmesinde API isteklerini kontrol et
3. API server loglarını kontrol et
4. Redis container'ın çalıştığını doğrula

## 📊 Beklenen Sonuçlar

Yeniden başlatma sonrası:

- ✅ **Status**: AOF Enabled ✓, RDB Preamble ✓
- ✅ **Metrics**: AOF Base Size > 0, Total File Size > 0
- ✅ **AOF Structure**: RDB Preamble + AOF Commands gösterimi
- ✅ **Performance Chart**: Zaman içinde veri değişimi

## 🚀 Hızlı Komutlar

```powershell
# Tüm servisleri durdur
cd hybrid-persistence
docker-compose down -v

# Redis'i başlat
docker-compose up -d redis-hybrid

# API server'ı başlat
cd visualization
.\restart-all.bat
```

