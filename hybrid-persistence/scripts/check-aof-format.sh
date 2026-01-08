#!/bin/sh
# AOF dosyasının formatını kontrol etme scripti
# RDB preamble'ı tespit eder

REDIS_HOST=${1:-redis-hybrid}

echo "=========================================="
echo "AOF Dosya Formatı Kontrolü"
echo "=========================================="
echo ""

AOF_FILE="/data/appendonly.aof"

# AOF dosyasının varlığını kontrol et
if ! docker exec $REDIS_HOST sh -c "test -f $AOF_FILE"; then
  echo "⚠ AOF dosyası henüz oluşturulmadı."
  echo "   Veri ekleyip BGREWRITEAOF çalıştırın."
  exit 1
fi

echo "AOF dosyası bulundu: $AOF_FILE"
echo ""

# Dosya boyutu
SIZE=$(docker exec $REDIS_HOST sh -c "stat -c%s $AOF_FILE 2>/dev/null || stat -f%z $AOF_FILE 2>/dev/null")
echo "Dosya boyutu: $SIZE bytes"
echo ""

# İlk 10 byte'ı kontrol et (RDB magic number)
echo "İlk 10 byte (hex):"
docker exec $REDIS_HOST sh -c "head -c 10 $AOF_FILE | od -A x -t x1z -v | head -1"
echo ""

# RDB formatı kontrolü
FIRST_BYTES=$(docker exec $REDIS_HOST sh -c "head -c 5 $AOF_FILE")
if [ "$FIRST_BYTES" = "REDIS" ]; then
  echo "✓ RDB Preamble tespit edildi!"
  echo "  AOF dosyası Hybrid Mode formatında (RDB + AOF)"
else
  echo "⚠ RDB Preamble bulunamadı."
  echo "  AOF dosyası eski format (sadece AOF komutları)"
  echo "  BGREWRITEAOF çalıştırarak hybrid format'a dönüştürebilirsiniz."
fi
echo ""

# Dosya tipi kontrolü
echo "Dosya tipi:"
docker exec $REDIS_HOST sh -c "file $AOF_FILE"
echo ""

# İlk 100 karakter (görsel kontrol)
echo "İlk 100 karakter (görsel):"
docker exec $REDIS_HOST sh -c "head -c 100 $AOF_FILE | od -A x -t x1z -v | head -5"

