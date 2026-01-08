#!/bin/sh
# Performans testi - Yükleme sürelerini karşılaştır

echo "=========================================="
echo "Persistence Mode Performans Testi"
echo "=========================================="
echo ""

# Test verisi ekle
echo "1. Test verisi ekleniyor (10,000 key)..."
for i in $(seq 1 10000); do
  docker exec redis-hybrid redis-cli SET "perf:key:$i" "value:$i" > /dev/null 2>&1
  if [ $((i % 2000)) -eq 0 ]; then
    echo "   $i key eklendi..."
  fi
done
echo "   ✓ Veri eklendi"
echo ""

# AOF rewrite tetikle (RDB preamble oluştur)
echo "2. AOF rewrite tetikleniyor (RDB preamble oluşturulacak)..."
docker exec redis-hybrid redis-cli BGREWRITEAOF
sleep 5
echo "   ✓ AOF rewrite tamamlandı"
echo ""

# Yükleme süresi testi
echo "3. Yükleme süresi testi..."
echo "   Redis yeniden başlatılıyor..."

# Süre ölçümü
START_TIME=$(date +%s.%N)
docker restart redis-hybrid > /dev/null 2>&1

# Redis'in hazır olmasını bekle
sleep 2
while ! docker exec redis-hybrid redis-cli PING > /dev/null 2>&1; do
  sleep 0.5
done
END_TIME=$(date +%s.%N)

ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)
echo "   Yükleme süresi: ${ELAPSED} saniye"
echo ""

# Veri kontrolü
echo "4. Veri bütünlüğü kontrol ediliyor..."
COUNT=$(docker exec redis-hybrid redis-cli DBSIZE)
echo "   Key sayısı: $COUNT"
if [ "$COUNT" -ge 10000 ]; then
  echo "   ✓ Tüm veriler yüklendi"
else
  echo "   ⚠ Bazı veriler eksik olabilir"
fi
echo ""

echo "=========================================="
echo "Test tamamlandı!"
echo "=========================================="

