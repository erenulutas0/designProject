#!/bin/sh
# Hybrid Persistence Mode test scripti

REDIS_HOST=${1:-redis-hybrid}
REDIS_PORT=${2:-6379}

echo "=========================================="
echo "Hybrid Persistence Mode Test"
echo "=========================================="
echo ""

# 1. Bağlantı testi
echo "1. Redis bağlantısı test ediliyor..."
redis-cli -h $REDIS_HOST -p $REDIS_PORT PING
if [ $? -eq 0 ]; then
  echo "   ✓ Bağlantı başarılı"
else
  echo "   ✗ Bağlantı başarısız!"
  exit 1
fi
echo ""

# 2. Persistence durumu
echo "2. Persistence yapılandırması kontrol ediliyor..."
AOF_ENABLED=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG GET appendonly | tail -1)
AOF_PREAMBLE=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG GET aof-use-rdb-preamble | tail -1)

echo "   AOF Enabled: $AOF_ENABLED"
echo "   RDB Preamble: $AOF_PREAMBLE"

if [ "$AOF_ENABLED" = "yes" ] && [ "$AOF_PREAMBLE" = "yes" ]; then
  echo "   ✓ Hybrid Mode aktif!"
else
  echo "   ✗ Hybrid Mode aktif değil!"
fi
echo ""

# 3. Veri ekleme
echo "3. Test verisi ekleniyor..."
redis-cli -h $REDIS_HOST -p $REDIS_PORT SET test:hybrid "Hybrid Mode Test" > /dev/null
redis-cli -h $REDIS_HOST -p $REDIS_PORT INCR test:counter > /dev/null
redis-cli -h $REDIS_HOST -p $REDIS_PORT INCR test:counter > /dev/null
echo "   ✓ Veri eklendi"
echo ""

# 4. Veri kontrolü
echo "4. Veri kontrol ediliyor..."
VALUE=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT GET test:hybrid)
COUNTER=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT GET test:counter)
echo "   test:hybrid = $VALUE"
echo "   test:counter = $COUNTER"
echo ""

# 5. AOF dosyası kontrolü
echo "5. AOF dosyası kontrol ediliyor..."
docker exec $REDIS_HOST sh -c "test -f /data/appendonly.aof && echo '   ✓ AOF dosyası mevcut' || echo '   ⚠ AOF dosyası henüz oluşturulmadı'"
echo ""

# 6. Persistence istatistikleri
echo "6. Persistence istatistikleri:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO persistence | grep -E "(aof_enabled|aof_use_rdb_preamble|aof_current_size|aof_base_size|rdb_last_save_time)"
echo ""

echo "=========================================="
echo "Test tamamlandı!"
echo "=========================================="

