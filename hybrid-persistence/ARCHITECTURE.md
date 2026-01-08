# 🏗️ Hybrid Persistence Mode - Mimari Açıklama

## Mimari Diyagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Redis Hybrid Persistence                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AOF File Structure                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  RDB Preamble (Binary Format)                       │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ Magic: "REDIS"                                 │  │  │
│  │  │ Version: Redis Version                        │  │  │
│  │  │ Database 0: {key1:value1, key2:value2, ...}   │  │  │
│  │  │ Database 1: {...}                             │  │  │
│  │  │ ...                                            │  │  │
│  │  │ Checksum                                       │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  AOF Commands (Text Format)                         │  │
│  │  *3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n  │  │
│  │  *3\r\n$3\r\nSET\r\n$4\r\nkey2\r\n$6\r\nvalue2\r\n│  │
│  │  ...                                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Veri Akışı

### 1. Yazma Akışı

```
Client Request
    ↓
Redis Memory
    ↓
AOF Buffer (in-memory)
    ↓
AOF File (appendonly.aof)
    ↓
[Every Second] → Disk Sync
```

### 2. AOF Rewrite Akışı

```
BGREWRITEAOF Triggered
    ↓
Fork Child Process
    ↓
┌─────────────────────────────────────┐
│  Child Process:                     │
│  1. Take RDB Snapshot               │
│  2. Write RDB to new AOF (preamble) │
│  3. Buffer new commands             │
└─────────────────────────────────────┘
    ↓
Rewrite Complete
    ↓
Append Buffered Commands
    ↓
Replace Old AOF with New AOF
```

### 3. Yükleme Akışı

```
Redis Startup
    ↓
Read AOF File
    ↓
Check First 5 Bytes
    ↓
┌─────────────────┐
│ Is "REDIS"?     │
└────────┬────────┘
         │
    Yes  │  No
    ↓    ↓
┌────────┴────────┐
│                │
↓                ↓
Load RDB         Load AOF
Preamble         Commands
(Fast)           (Slow)
    ↓                ↓
    └────────┬───────┘
             ↓
    Apply Remaining
    AOF Commands
             ↓
    Data Ready
```

## Karşılaştırma Tablosu

### Persistence Modları

| Özellik | RDB Only | AOF Only (Old) | Hybrid Mode |
|---------|----------|----------------|-------------|
| **Format** | Binary | Text | Binary + Text |
| **Dosya Başlangıcı** | `REDIS` | `*` (command) | `REDIS` |
| **Yükleme** | O(n) - Hızlı | O(n²) - Yavaş | O(n) - Hızlı |
| **Veri Güvenliği** | Snapshot'a kadar | Tam | Tam |
| **Dosya Boyutu** | Küçük | Orta | Küçük-Orta |
| **Rewrite Süresi** | N/A | Uzun | Orta |

### Performans Metrikleri

```
Yükleme Süresi (1M keys, 100MB):
┌─────────────────────────────────────────┐
│ RDB Only:      ████░░░░░░ 2s            │
│ Hybrid Mode:   ██████░░░░ 5s            │
│ AOF Only:      ████████████████████ 45s  │
└─────────────────────────────────────────┘

Dosya Boyutu (1M keys, 100MB):
┌─────────────────────────────────────────┐
│ RDB Only:      ████░░░░░░ 45MB          │
│ Hybrid Mode:   █████░░░░░ 55MB          │
│ AOF Only:      ██████████░░ 180MB       │
└─────────────────────────────────────────┘
```

## Yapılandırma Senaryoları

### Senaryo 1: Maximum Performance
```bash
appendonly yes
appendfsync no
aof-use-rdb-preamble yes
```
→ Hızlı ama riskli

### Senaryo 2: Balanced (Önerilen) ⭐
```bash
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
```
→ Güvenlik ve performans dengesi

### Senaryo 3: Maximum Safety
```bash
appendonly yes
appendfsync always
aof-use-rdb-preamble yes
```
→ En güvenli ama yavaş

## AOF Rewrite Tetikleme

### Otomatik Tetikleme

```
AOF Current Size
    ↓
┌─────────────────────────────────────┐
│ > auto-aof-rewrite-min-size?       │
│ AND                                 │
│ > (base_size * percentage)?        │
└──────────────┬──────────────────────┘
               │
          Yes  │  No
          ↓    ↓
    Trigger    Wait
    Rewrite
```

### Manuel Tetikleme

```bash
redis-cli BGREWRITEAOF
```

## Dosya Yapısı Örneği

### Hybrid Mode AOF Dosyası

```
Offset  Content                    Type
─────────────────────────────────────────────
0x0000  REDIS                      Magic
0x0005  0009                       Version
0x0009  FA                         Database Selector
0x000A  [RDB Data...]              Database 0 Data
        ...                        (compressed)
0x1F40  FE 00                      End of RDB
0x1F42  FF                         EOF
0x1F43  [checksum]                 Checksum
─────────────────────────────────────────────
0x1F50  *3\r\n                     AOF Command Start
0x1F55  $3\r\nSET\r\n              SET command
0x1F5E  $3\r\nkey\r\n              Key
0x1F65  $5\r\nvalue\r\n            Value
        ...                        More commands
```

## Monitoring Noktaları

### Kritik Metrikler

1. **aof_current_size**: Mevcut AOF boyutu
2. **aof_base_size**: Son rewrite'taki boyut
3. **aof_rewrite_in_progress**: Rewrite devam ediyor mu?
4. **aof_last_rewrite_time_sec**: Son rewrite süresi
5. **aof_rewrite_scheduled**: Rewrite planlandı mı?

### Alarm Eşikleri

- AOF boyutu > 10GB → Rewrite gerekli
- Rewrite süresi > 60s → Performans sorunu
- aof_rewrite_in_progress > 300s → Sorun var

## Best Practices

1. ✅ **Her zaman hybrid mode kullan**
2. ✅ **appendfsync: everysec** (önerilen)
3. ✅ **Düzenli monitoring yap**
4. ✅ **Disk alanını izle** (rewrite için 2x gerekir)
5. ✅ **Backup stratejisi oluştur**
6. ❌ **appendfsync: always** kullanma (çok yavaş)
7. ❌ **AOF'u kapatma** (production'da)

