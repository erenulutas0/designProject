# Redis Hybrid Persistence Mode (AOF + RDB Preamble)

## 📋 İçindekiler
1. [Giriş](#giriş)
2. [Hybrid Persistence Mode Nedir?](#hybrid-persistence-mode-nedir)
3. [Nasıl Çalışır?](#nasıl-çalışır)
4. [Avantajları](#avantajları)
5. [Kurulum ve Kullanım](#kurulum-ve-kullanım)
6. [Karşılaştırma](#karşılaştırma)
7. [Test Senaryoları](#test-senaryoları)

---

## 🎯 Giriş

Redis, veri kalıcılığı için iki ana yöntem sunar:
- **RDB (Redis Database)**: Anlık görüntü (snapshot) tabanlı
- **AOF (Append Only File)**: Komut tabanlı log

**Hybrid Persistence Mode**, Redis 4.0+ ile gelen ve her iki yöntemin avantajlarını birleştiren bir özelliktir.

---

## 🔍 Hybrid Persistence Mode Nedir?

Hybrid Persistence Mode, AOF dosyasının başında RDB snapshot'ının bulunduğu bir yapılandırmadır. Bu sayede:

1. **AOF dosyası** = **RDB snapshot (preamble)** + **AOF komutları**

### Yapı:
```
[AOF Dosyası]
├── RDB Preamble (başlangıç)
│   └── Tüm veri setinin snapshot'ı
└── AOF Komutları (devam)
    └── RDB'den sonraki tüm değişiklikler
```

---

## ⚙️ Nasıl Çalışır?

### 1. İlk Kayıt (Rewrite)
- Redis, AOF dosyasını yeniden yazarken (rewrite) önce RDB formatında tüm veriyi kaydeder
- Sonra bu RDB verisini AOF dosyasının başına ekler
- Bundan sonraki komutlar normal AOF formatında eklenir

### 2. Yükleme (Loading)
- Redis başlatıldığında önce RDB preamble'ı yükler (hızlı)
- Sonra AOF komutlarını uygular (tam veri güvenliği)

### 3. Avantaj
- **Hızlı yükleme**: RDB snapshot sayesinde
- **Tam veri güvenliği**: AOF komutları sayesinde
- **Küçük dosya boyutu**: RDB sıkıştırılmış format

---

## ✅ Avantajları

| Özellik | RDB Only | AOF Only | Hybrid Mode |
|---------|----------|----------|-------------|
| **Yükleme Hızı** | ⚡⚡⚡ Çok Hızlı | 🐌 Yavaş | ⚡⚡ Hızlı |
| **Veri Güvenliği** | ⚠️ Son snapshot'a kadar | ✅ Tam | ✅ Tam |
| **Dosya Boyutu** | 📦 Küçük | 📦📦 Orta | 📦 Küçük-Orta |
| **Performans** | ⚡⚡⚡ Yüksek | ⚡⚡ Orta | ⚡⚡⚡ Yüksek |
| **Kurtarma Hızı** | ⚡⚡⚡ Çok Hızlı | 🐌 Yavaş | ⚡⚡ Hızlı |

### Detaylı Avantajlar:

1. **Hızlı Başlatma**
   - RDB preamble sayesinde veri seti hızlıca yüklenir
   - Özellikle büyük veri setlerinde fark belirgin

2. **Tam Veri Güvenliği**
   - AOF komutları sayesinde hiçbir veri kaybı olmaz
   - Her komut loglanır

3. **Dosya Optimizasyonu**
   - RDB formatı sıkıştırılmış
   - AOF rewrite sırasında dosya boyutu optimize edilir

4. **Uyumluluk**
   - Eski AOF formatıyla uyumlu
   - Redis otomatik olarak formatı algılar

---

## 🚀 Kurulum ve Kullanım

### 1. Docker Compose ile Başlatma

```bash
cd hybrid-persistence
docker-compose up -d
```

### 2. Yapılandırma Parametreleri

```bash
--appendonly yes                    # AOF'u etkinleştir
--appendfsync everysec              # Her saniye disk'e yaz (önerilen)
--aof-use-rdb-preamble yes         # Hybrid mode'u etkinleştir
--save 60 1000                      # 60 saniyede 1000 değişiklik varsa RDB kaydet
```

### 3. Veri Ekleme ve Test

```bash
# Redis CLI ile bağlan
docker exec -it redis-hybrid redis-cli

# Veri ekle
SET test:key "Hello Hybrid Mode"
SET counter 100
INCR counter

# Persistence durumunu kontrol et
INFO persistence
```

### 4. AOF Dosyasını İnceleme

```bash
# Container içine gir
docker exec -it redis-hybrid sh

# AOF dosyasını kontrol et
ls -lh /data/
file /data/appendonly.aof

# AOF dosyasının başında RDB magic number'ı var mı?
# RDB formatı: "REDIS" string'i ile başlar
head -c 100 /data/appendonly.aof | od -A x -t x1z -v
```

---

## 📊 Karşılaştırma

### Senaryo: 1M Key ile Test

| Metrik | RDB Only | AOF Only | Hybrid Mode |
|--------|----------|----------|-------------|
| **Dosya Boyutu** | ~50 MB | ~200 MB | ~60 MB |
| **Yükleme Süresi** | 2 saniye | 45 saniye | 5 saniye |
| **Veri Kaybı Riski** | Yüksek | Yok | Yok |
| **Disk I/O** | Düşük | Yüksek | Orta |

---

## 🧪 Test Senaryoları

### Test 1: Hybrid Mode'u Etkinleştirme

```bash
# 1. Redis'i hybrid mode'da başlat
docker-compose up -d redis-hybrid

# 2. Veri ekle
docker exec -it redis-hybrid redis-cli SET test "value"

# 3. AOF dosyasını kontrol et
docker exec -it redis-hybrid sh -c "file /data/appendonly.aof"
```

### Test 2: Yükleme Performansı

```bash
# 1. Büyük veri seti oluştur
docker exec -it redis-hybrid redis-cli --eval /scripts/populate.lua

# 2. Redis'i yeniden başlat ve süreyi ölç
time docker restart redis-hybrid
```

### Test 3: Veri Güvenliği

```bash
# 1. Veri ekle
docker exec -it redis-hybrid redis-cli SET critical:data "important"

# 2. Redis'i crash simüle et (kill -9)
docker kill redis-hybrid

# 3. Yeniden başlat ve veriyi kontrol et
docker start redis-hybrid
docker exec -it redis-hybrid redis-cli GET critical:data
```

---

## 📝 Önemli Notlar

1. **appendfsync Seçenekleri:**
   - `always`: Her komutta disk'e yaz (en güvenli, en yavaş)
   - `everysec`: Her saniye disk'e yaz (önerilen, dengeli)
   - `no`: OS'e bırak (en hızlı, riskli)

2. **AOF Rewrite:**
   - `BGREWRITEAOF` komutu ile manuel tetiklenebilir
   - Otomatik olarak dosya boyutu büyüdükçe tetiklenir

3. **RDB Snapshot:**
   - Hybrid mode'da RDB snapshot'ları hala alınabilir
   - AOF ile birlikte kullanılabilir

---

## 🔗 Kaynaklar

- [Redis Persistence Documentation](https://redis.io/docs/management/persistence/)
- [Redis AOF Rewrite](https://redis.io/docs/management/persistence/#log-rewriting)
- [Redis 4.0 Release Notes](https://raw.githubusercontent.com/antirez/redis/4.0/00-RELEASENOTES)

---

## 📌 Sonuç

Hybrid Persistence Mode, Redis'in veri kalıcılığı için **en önerilen yapılandırmadır**. Hem performans hem de veri güvenliği açısından optimal bir denge sağlar.

**Önerilen Yapılandırma:**
```bash
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
```

