#!/bin/sh
# Hybrid Persistence Mode Demo Scripti

echo "=========================================="
echo "Redis Hybrid Persistence Mode Demo"
echo "=========================================="
echo ""

# 1. Servisleri başlat
echo "1. Redis servisleri başlatılıyor..."
docker-compose up -d redis-hybrid
sleep 3
echo "   ✓ Servisler başlatıldı"
echo ""

# 2. Hybrid mode kontrolü
echo "2. Hybrid Mode yapılandırması kontrol ediliyor..."
./scripts/test-hybrid-mode.sh redis-hybrid 6379
echo ""

# 3. Veri ekle
echo "3. Demo verisi ekleniyor..."
docker exec redis-hybrid redis-cli MSET \
  "user:1" "Alice" \
  "user:2" "Bob" \
  "user:3" "Charlie" \
  "session:abc123" "active" \
  "counter:visits" "1000"

docker exec redis-hybrid redis-cli INCR counter:visits
docker exec redis-hybrid redis-cli INCR counter:visits

echo "   ✓ Veri eklendi"
echo ""

# 4. AOF rewrite tetikle
echo "4. AOF rewrite tetikleniyor (RDB preamble oluşturulacak)..."
docker exec redis-hybrid redis-cli BGREWRITEAOF
echo "   AOF rewrite başlatıldı, bekleniyor..."
sleep 5
echo "   ✓ AOF rewrite tamamlandı"
echo ""

# 5. AOF formatını kontrol et
echo "5. AOF dosya formatı kontrol ediliyor..."
./scripts/check-aof-format.sh redis-hybrid
echo ""

# 6. Persistence istatistikleri
echo "6. Persistence istatistikleri:"
docker exec redis-hybrid redis-cli INFO persistence | grep -E "(aof_enabled|aof_use_rdb_preamble|aof_current_size|aof_base_size|aof_rewrite_in_progress|rdb_last_save_time)"
echo ""

# 7. Veri kontrolü
echo "7. Veri kontrolü:"
echo "   user:1 = $(docker exec redis-hybrid redis-cli GET user:1)"
echo "   counter:visits = $(docker exec redis-hybrid redis-cli GET counter:visits)"
echo ""

echo "=========================================="
echo "Demo tamamlandı!"
echo "=========================================="
echo ""
echo "Sonraki adımlar:"
echo "  - ./scripts/compare-persistence.sh  # Tüm modları karşılaştır"
echo "  - ./scripts/performance-test.sh      # Performans testi"
echo "  - docker exec -it redis-hybrid redis-cli  # Redis CLI'ye bağlan"

