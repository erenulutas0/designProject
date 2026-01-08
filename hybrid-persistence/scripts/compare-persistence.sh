#!/bin/sh
# Persistence modlarını karşılaştırma scripti

echo "=========================================="
echo "Redis Persistence Mode Karşılaştırması"
echo "=========================================="
echo ""

# Hybrid Mode
echo "1. HYBRID MODE (AOF + RDB Preamble)"
echo "-----------------------------------"
docker exec redis-hybrid redis-cli INFO persistence | grep -E "(aof_enabled|aof_use_rdb_preamble|rdb_last_save_time|aof_last_rewrite_time_sec)"
echo ""

# RDB Only
echo "2. RDB ONLY"
echo "-----------------------------------"
docker exec redis-rdb-only redis-cli INFO persistence | grep -E "(aof_enabled|rdb_last_save_time)"
echo ""

# AOF Only
echo "3. AOF ONLY (Eski Format)"
echo "-----------------------------------"
docker exec redis-aof-only redis-cli INFO persistence | grep -E "(aof_enabled|aof_use_rdb_preamble|aof_last_rewrite_time_sec)"
echo ""

# Dosya boyutları
echo "=========================================="
echo "Dosya Boyutları"
echo "=========================================="
echo "Hybrid Mode:"
docker exec redis-hybrid sh -c "ls -lh /data/appendonly.aof 2>/dev/null || echo 'AOF dosyası henüz oluşturulmadı'"
echo ""
echo "RDB Only:"
docker exec redis-rdb-only sh -c "ls -lh /data/dump.rdb 2>/dev/null || echo 'RDB dosyası henüz oluşturulmadı'"
echo ""
echo "AOF Only:"
docker exec redis-aof-only sh -c "ls -lh /data/appendonly.aof 2>/dev/null || echo 'AOF dosyası henüz oluşturulmadı'"

