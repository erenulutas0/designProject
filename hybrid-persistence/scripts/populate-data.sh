#!/bin/sh
# Büyük veri seti oluşturma scripti - Performans testi için

REDIS_HOST=${1:-redis-hybrid}
REDIS_PORT=${2:-6379}

echo "Veri seti oluşturuluyor..."

# 10,000 key oluştur
for i in $(seq 1 10000); do
  redis-cli -h $REDIS_HOST -p $REDIS_PORT SET "key:$i" "value:$i" > /dev/null 2>&1
  if [ $((i % 1000)) -eq 0 ]; then
    echo "  $i key oluşturuldu..."
  fi
done

echo "Veri seti oluşturma tamamlandı!"
redis-cli -h $REDIS_HOST -p $REDIS_PORT DBSIZE

