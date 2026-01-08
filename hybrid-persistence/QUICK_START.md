# 🚀 Hızlı Başlangıç - Hybrid Persistence Mode

## 1. Servisleri Başlat

```bash
cd hybrid-persistence
docker-compose up -d
```

## 2. Demo Çalıştır

```bash
# Scriptlere çalıştırma izni ver (Linux/Mac)
chmod +x scripts/*.sh

# Demo scriptini çalıştır
./scripts/demo.sh
```

## 3. Manuel Test

```bash
# Redis CLI'ye bağlan
docker exec -it redis-hybrid redis-cli

# Veri ekle
SET test "Hybrid Mode Test"
GET test

# AOF rewrite tetikle (RDB preamble oluştur)
BGREWRITEAOF

# Persistence durumunu kontrol et
INFO persistence
```

## 4. Karşılaştırma

```bash
# Tüm persistence modlarını karşılaştır
./scripts/compare-persistence.sh
```

## 5. AOF Formatını Kontrol Et

```bash
# AOF dosyasının RDB preamble içerip içermediğini kontrol et
./scripts/check-aof-format.sh redis-hybrid
```

## 📚 Daha Fazla Bilgi

- `README.md` - Genel açıklama ve kullanım kılavuzu
- `HYBRID_PERSISTENCE_EXPLAINED.md` - Detaylı teknik açıklama

