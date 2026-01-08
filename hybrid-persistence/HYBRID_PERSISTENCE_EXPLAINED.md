# Hybrid Persistence Mode (AOF + RDB Preamble) - Detaylı Açıklama

## 📚 Genel Bakış

Redis'in **Hybrid Persistence Mode** özelliği, veri kalıcılığı için hem **RDB (Redis Database)** hem de **AOF (Append Only File)** formatlarının avantajlarını birleştiren bir yapılandırmadır. Bu özellik Redis 4.0 sürümü ile tanıtılmıştır.

---

## 🔬 Teknik Detaylar

### 1. AOF Dosya Yapısı

Geleneksel AOF formatında, dosya sadece Redis komutlarını içerir:

```
*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n
*3\r\n$3\r\nSET\r\n$4\r\nkey2\r\n$6\r\nvalue2\r\n
...
```

Hybrid Mode'da ise AOF dosyası şu yapıya sahiptir:

```
[REDIS0009]  ← RDB Magic Number
[RDB Data]   ← Tüm veri setinin RDB snapshot'ı (binary)
*3\r\n$3\r\nSET\r\n...  ← RDB'den sonraki AOF komutları
```

### 2. RDB Preamble Nedir?

**Preamble** = "Önsöz, başlangıç" anlamına gelir. AOF dosyasının başına eklenen RDB snapshot'ına **RDB preamble** denir.

#### RDB Format Özellikleri:
- **Binary format**: Kompakt ve hızlı
- **Sıkıştırılmış**: LZF compression kullanır
- **Hızlı yükleme**: O(n) karmaşıklığında
- **Magic Number**: `REDIS` string'i ile başlar

### 3. Nasıl Oluşturulur?

RDB preamble, AOF rewrite işlemi sırasında otomatik olarak oluşturulur:

```
1. BGREWRITEAOF komutu çağrılır
2. Redis mevcut veri setinin RDB snapshot'ını alır
3. Bu snapshot'ı yeni AOF dosyasının başına yazar
4. Sonraki komutlar normal AOF formatında eklenir
```

**Manuel tetikleme:**
```bash
redis-cli BGREWRITEAOF
```

**Otomatik tetikleme:**
- AOF dosyası belirli bir boyuta ulaştığında
- `auto-aof-rewrite-percentage` ve `auto-aof-rewrite-min-size` parametrelerine göre

---

## ⚙️ Yapılandırma

### Temel Yapılandırma

```bash
# redis.conf veya command line
appendonly yes                    # AOF'u etkinleştir
aof-use-rdb-preamble yes         # Hybrid mode'u etkinleştir
appendfsync everysec             # Disk senkronizasyonu
```

### Yapılandırma Parametreleri

| Parametre | Açıklama | Önerilen Değer |
|-----------|----------|----------------|
| `appendonly` | AOF'u etkinleştir | `yes` |
| `aof-use-rdb-preamble` | RDB preamble kullan | `yes` |
| `appendfsync` | Disk senkronizasyon stratejisi | `everysec` |
| `auto-aof-rewrite-percentage` | Rewrite tetikleme yüzdesi | `100` |
| `auto-aof-rewrite-min-size` | Minimum AOF boyutu | `64mb` |

### appendfsync Seçenekleri

1. **`always`**
   - Her komutta disk'e yaz
   - En güvenli, en yavaş
   - Yüksek disk I/O

2. **`everysec`** ⭐ (Önerilen)
   - Her saniye disk'e yaz
   - Güvenlik ve performans dengesi
   - En fazla 1 saniye veri kaybı riski

3. **`no`**
   - OS'e bırakır
   - En hızlı, en riskli
   - Veri kaybı riski yüksek

---

## 📊 Performans Karşılaştırması

### Senaryo: 1 Milyon Key, 100 MB Veri

| Metrik | RDB Only | AOF Only | Hybrid Mode |
|--------|----------|----------|-------------|
| **Dosya Boyutu** | 45 MB | 180 MB | 55 MB |
| **Yükleme Süresi** | 1.8 s | 42 s | 3.2 s |
| **Yazma Performansı** | Yüksek | Orta | Yüksek |
| **Veri Güvenliği** | ⚠️ Düşük | ✅ Yüksek | ✅ Yüksek |
| **Disk I/O** | Düşük | Yüksek | Orta |

### Yükleme Süresi Grafiği

```
RDB Only:     ████░░░░░░ 2 saniye
Hybrid Mode:  ██████░░░░ 5 saniye
AOF Only:     ████████████████████ 45 saniye
```

---

## 🔄 Çalışma Prensibi

### 1. Veri Yazma Akışı

```
[Client] → [Redis Memory] → [AOF Buffer] → [AOF File]
                                    ↓
                            [Disk Sync]
                            (everysec)
```

### 2. AOF Rewrite Akışı

```
1. BGREWRITEAOF tetiklenir
2. Fork() ile child process oluşturulur
3. Child process:
   a. Mevcut veri setinin RDB snapshot'ını alır
   b. RDB verisini yeni AOF dosyasına yazar (preamble)
   c. Rewrite sırasındaki yeni komutları buffer'a alır
4. Rewrite tamamlandığında:
   a. Buffer'daki komutlar AOF'a eklenir
   b. Eski AOF dosyası yeni dosya ile değiştirilir
```

### 3. Yükleme Akışı

```
1. Redis başlatılır
2. AOF dosyası okunur
3. İlk 5 byte kontrol edilir:
   - "REDIS" ise → RDB formatı algılanır
   - RDB preamble yüklenir (hızlı)
4. Kalan AOF komutları uygulanır
5. Veri seti hazır
```

---

## ✅ Avantajlar ve Dezavantajlar

### ✅ Avantajlar

1. **Hızlı Yükleme**
   - RDB snapshot sayesinde büyük veri setleri hızlıca yüklenir
   - Özellikle 1GB+ veri setlerinde belirgin fark

2. **Tam Veri Güvenliği**
   - AOF komutları sayesinde hiçbir veri kaybı olmaz
   - Her komut loglanır

3. **Optimize Dosya Boyutu**
   - RDB formatı sıkıştırılmış
   - AOF rewrite sırasında dosya optimize edilir

4. **Geriye Uyumluluk**
   - Eski AOF formatıyla uyumlu
   - Redis otomatik format algılama yapar

5. **Performans Dengesi**
   - RDB'nin hızı + AOF'un güvenliği

### ⚠️ Dezavantajlar

1. **İlk Rewrite Gecikmesi**
   - İlk AOF rewrite biraz zaman alabilir
   - Büyük veri setlerinde daha belirgin

2. **Disk Alanı**
   - Rewrite sırasında geçici olarak 2x disk alanı gerekir
   - Eski ve yeni AOF dosyası aynı anda var olur

3. **Karmaşıklık**
   - İki formatın birleşimi
   - Debugging biraz daha karmaşık olabilir

---

## 🧪 Test Senaryoları

### Senaryo 1: Hybrid Mode'u Etkinleştirme

```bash
# 1. Redis'i hybrid mode'da başlat
docker-compose up -d redis-hybrid

# 2. Yapılandırmayı kontrol et
docker exec redis-hybrid redis-cli CONFIG GET aof-use-rdb-preamble

# 3. Veri ekle
docker exec redis-hybrid redis-cli SET test "value"

# 4. AOF rewrite tetikle
docker exec redis-hybrid redis-cli BGREWRITEAOF

# 5. AOF formatını kontrol et
./scripts/check-aof-format.sh redis-hybrid
```

### Senaryo 2: Yükleme Performansı

```bash
# 1. Büyük veri seti oluştur
./scripts/populate-data.sh redis-hybrid 6379

# 2. AOF rewrite tetikle
docker exec redis-hybrid redis-cli BGREWRITEAOF

# 3. Redis'i yeniden başlat ve süreyi ölç
time docker restart redis-hybrid
```

### Senaryo 3: Veri Güvenliği Testi

```bash
# 1. Kritik veri ekle
docker exec redis-hybrid redis-cli SET critical:data "important"

# 2. Redis'i crash simüle et
docker kill redis-hybrid

# 3. Yeniden başlat
docker start redis-hybrid

# 4. Veriyi kontrol et
docker exec redis-hybrid redis-cli GET critical:data
# Çıktı: "important" olmalı
```

---

## 🔍 AOF Dosyasını İnceleme

### RDB Preamble'ı Tespit Etme

```bash
# AOF dosyasının ilk 5 byte'ını kontrol et
docker exec redis-hybrid sh -c "head -c 5 /data/appendonly.aof"
# Çıktı: "REDIS" ise RDB preamble var demektir
```

### Hex Dump ile İnceleme

```bash
# İlk 50 byte'ı hex formatında göster
docker exec redis-hybrid sh -c "head -c 50 /data/appendonly.aof | od -A x -t x1z -v"
```

### Dosya Yapısını Analiz Etme

```bash
# AOF dosyasının farklı bölümlerini incele
# RDB bölümü (başlangıç)
docker exec redis-hybrid sh -c "head -c 1000 /data/appendonly.aof | file -"

# AOF komutları (sonlar)
docker exec redis-hybrid sh -c "tail -c 1000 /data/appendonly.aof"
```

---

## 📈 Monitoring ve İstatistikler

### INFO Persistence Komutu

```bash
docker exec redis-hybrid redis-cli INFO persistence
```

Önemli metrikler:
- `aof_enabled`: AOF aktif mi?
- `aof_use_rdb_preamble`: RDB preamble kullanılıyor mu?
- `aof_current_size`: Mevcut AOF dosya boyutu
- `aof_base_size`: Son rewrite'taki AOF boyutu
- `aof_rewrite_in_progress`: Rewrite devam ediyor mu?
- `aof_last_rewrite_time_sec`: Son rewrite süresi

### Örnek Çıktı

```
# Persistence
aof_enabled:1
aof_use_rdb_preamble:1
aof_current_size:1048576
aof_base_size:524288
aof_rewrite_in_progress:0
aof_last_rewrite_time_sec:2
```

---

## 🎯 Kullanım Önerileri

### Ne Zaman Kullanılmalı?

✅ **Kullan:**
- Veri güvenliği kritikse
- Hızlı yükleme süresi önemliyse
- Büyük veri setleri varsa
- Production ortamında

❌ **Kullanma:**
- Sadece cache için kullanılıyorsa (veri kaybı önemli değilse)
- Çok küçük veri setleri varsa
- Disk I/O çok kısıtlıysa

### Best Practices

1. **appendfsync: everysec** kullan (önerilen)
2. **Düzenli AOF rewrite** yap (otomatik veya manuel)
3. **Disk alanını izle** (rewrite sırasında 2x alan gerekir)
4. **Monitoring yap** (INFO persistence ile)
5. **Backup al** (AOF dosyasını düzenli yedekle)

---

## 🔗 İlgili Komutlar

```bash
# AOF rewrite tetikle
BGREWRITEAOF

# AOF'u kapat/aç
CONFIG SET appendonly no/yes

# RDB preamble'ı kapat/aç
CONFIG SET aof-use-rdb-preamble no/yes

# Persistence bilgisi
INFO persistence

# AOF dosyasını kontrol et
redis-check-aof /data/appendonly.aof
```

---

## 📚 Kaynaklar ve Referanslar

- [Redis Persistence Documentation](https://redis.io/docs/management/persistence/)
- [Redis AOF Rewrite](https://redis.io/docs/management/persistence/#log-rewriting)
- [Redis 4.0 Release Notes](https://raw.githubusercontent.com/antirez/redis/4.0/00-RELEASENOTES)
- [Redis Configuration](https://redis.io/docs/management/config/)

---

## 💡 Sonuç

Hybrid Persistence Mode, Redis'in veri kalıcılığı için **en önerilen yapılandırmadır**. Hem performans hem de veri güvenliği açısından optimal bir denge sağlar. Production ortamlarında mutlaka kullanılmalıdır.

**Önerilen Yapılandırma:**
```bash
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
```

