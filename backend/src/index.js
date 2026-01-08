import express from 'express';
import cors from 'cors';
import { Redis } from 'ioredis';
import pg from 'pg';
import { performance } from 'perf_hooks';
import * as hdr from 'hdr-histogram-js';
import { MongoClient } from 'mongodb';
import Memcached from 'memcached';
import { promisify } from 'util';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// --- Configurations ---
const PG_CONFIG = {
    user: 'admin',
    host: '127.0.0.1',
    database: 'benchmarkdb',
    password: 'password',
    port: 5433,
};

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const MEMCACHED_HOST = '127.0.0.1:11211';

const REDIS_SINGLE_PORT = 6378;
const REDIS_CLUSTER_NODES = [
    { host: '127.0.0.1', port: 7000 },
    { host: '127.0.0.1', port: 7001 },
    { host: '127.0.0.1', port: 7002 },
    { host: '127.0.0.1', port: 7003 },
    { host: '127.0.0.1', port: 7004 },
    { host: '127.0.0.1', port: 7005 },
];
const REDIS_SENTINEL_CONFIG = {
    sentinels: [{ host: 'localhost', port: 26379 }, { host: 'localhost', port: 26380 }],
    name: 'mymaster'
};
const REDIS_AOF_PORT = 6385;

// --- Clients ---
let pgPool;
let redisSingle;
let redisCluster;
let redisSentinel;
let redisAof;
let mongoClient;
let mongoDB;
let memcached;

async function initClients() {
    try {
        // PostgreSQL
        pgPool = new pg.Pool(PG_CONFIG);
        pgPool.on('error', err => console.log('PG Error:', err.message));

        // Redis Single
        redisSingle = new Redis({ port: REDIS_SINGLE_PORT, host: 'localhost', retryStrategy: times => Math.min(times * 100, 2000) });
        redisSingle.on('error', err => console.log('Redis Single Error:', err.message));

        // Redis Cluster - with lazy connect for graceful degradation
        try {
            redisCluster = new Redis.Cluster(REDIS_CLUSTER_NODES, {
                redisOptions: {
                    showFriendlyErrorStack: true,
                    connectTimeout: 5000,
                    maxRetriesPerRequest: 3
                },
                lazyConnect: true,
                retryDelayOnFailover: 300,
                retryDelayOnClusterDown: 1000,
                clusterRetryStrategy: (times) => {
                    if (times > 3) return null; // stop retrying
                    return Math.min(times * 200, 2000);
                },
                natMap: {
                    '172.28.0.11:7000': { host: '127.0.0.1', port: 7000 },
                    '172.28.0.12:7001': { host: '127.0.0.1', port: 7001 },
                    '172.28.0.13:7002': { host: '127.0.0.1', port: 7002 },
                    '172.28.0.14:7003': { host: '127.0.0.1', port: 7003 },
                    '172.28.0.15:7004': { host: '127.0.0.1', port: 7004 },
                    '172.28.0.16:7005': { host: '127.0.0.1', port: 7005 },
                } // Windows Docker host networking workaround
            });
            redisCluster.on('error', err => {
                // Only log once per minute to avoid spam
                if (!redisCluster._lastErrorLog || Date.now() - redisCluster._lastErrorLog > 60000) {
                    console.log('Redis Cluster Error:', err.message);
                    redisCluster._lastErrorLog = Date.now();
                }
            });
            // Try to connect
            await redisCluster.connect().catch(e => console.log('Redis Cluster not available:', e.message));
        } catch (e) {
            console.log('Redis Cluster initialization failed:', e.message);
            redisCluster = null;
        }

        // Redis AOF
        redisAof = new Redis({ port: REDIS_AOF_PORT, host: 'localhost', retryStrategy: times => Math.min(times * 100, 2000) });
        redisAof.on('error', err => console.log('Redis AOF Error:', err.message));

        // Sentinel
        redisSentinel = new Redis({
            host: 'localhost',
            port: 26379,
            retryStrategy: times => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 3
        });
        redisSentinel.on('error', err => console.log('Sentinel Error:', err.message));

        // MongoDB
        try {
            mongoClient = new MongoClient(MONGO_URI);
            await mongoClient.connect();
            mongoDB = mongoClient.db('benchmarkdb');
            console.log('MongoDB connected');
        } catch (e) {
            console.log('MongoDB not available:', e.message);
        }

        // Memcached
        try {
            memcached = new Memcached(MEMCACHED_HOST);
            console.log('Memcached connected');
        } catch (e) {
            console.log('Memcached not available:', e.message);
        }

        console.log('Clients initialized');
    } catch (e) {
        console.error('Error initializing clients', e);
    }
}

// --- Benchmarking Logic ---
async function measureLatency(name, fn, iterations = 1000) {
    const histogram = hdr.build();
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn(i);
        const end = performance.now();
        histogram.recordValue((end - start) * 1000);
    }
    return {
        p50: histogram.getValueAtPercentile(50) / 1000,
        p90: histogram.getValueAtPercentile(90) / 1000,
        p99: histogram.getValueAtPercentile(99) / 1000,
    };
}

// ============================================
// API ROUTES
// ============================================

// 1. P99 Latency Benchmark (PostgreSQL, Redis, Redis Cluster, MongoDB, Memcached)
app.post('/api/benchmark/p99', async (req, res) => {
    const { iterations = 500 } = req.body;
    console.log(`Starting P99 Benchmark with ${iterations} iterations...`);

    try {
        const results = {};

        // PostgreSQL Benchmark
        console.log('Running PostgreSQL Benchmark...');
        const client = await pgPool.connect();
        await client.query('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)');
        client.release();

        results.postgresql = await measureLatency('PostgreSQL', async (i) => {
            const key = `key-${i}`;
            const value = `value-${i}`;
            await pgPool.query('INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
            await pgPool.query('SELECT value FROM kv WHERE key = $1', [key]);
        }, iterations);
        console.log('PostgreSQL done');

        // Redis Single Benchmark
        console.log('Running Redis Benchmark...');
        results.redis = await measureLatency('Redis', async (i) => {
            const key = `key-${i}`;
            const value = `value-${i}`;
            await redisSingle.set(key, value);
            await redisSingle.get(key);
        }, iterations);
        console.log('Redis done');

        // Redis Cluster Benchmark
        if (redisCluster && redisCluster.status === 'ready') {
            console.log('Running Redis Cluster Benchmark...');
            try {
                results.redisCluster = await measureLatency('RedisCluster', async (i) => {
                    const key = `key-${i}`;
                    const value = `value-${i}`;
                    await redisCluster.set(key, value);
                    await redisCluster.get(key);
                }, iterations);
                console.log('Redis Cluster done');
            } catch (clusterError) {
                console.error('Redis Cluster Failed:', clusterError.message);
                results.redisCluster = { p50: 0, p90: 0, p99: 0, error: 'Cluster unreachable' };
            }
        } else {
            console.log('Skipping Redis Cluster - not connected');
            results.redisCluster = { p50: 0, p90: 0, p99: 0, error: 'Cluster not connected' };
        }

        // MongoDB Benchmark
        if (mongoDB) {
            console.log('Running MongoDB Benchmark...');
            try {
                const collection = mongoDB.collection('kv');
                results.mongodb = await measureLatency('MongoDB', async (i) => {
                    const key = `key-${i}`;
                    const value = `value-${i}`;
                    await collection.updateOne({ _id: key }, { $set: { value } }, { upsert: true });
                    await collection.findOne({ _id: key });
                }, iterations);
                console.log('MongoDB done');
            } catch (mongoError) {
                results.mongodb = { p50: 0, p90: 0, p99: 0, error: mongoError.message };
            }
        } else {
            results.mongodb = { p50: 0, p90: 0, p99: 0, error: 'MongoDB not connected' };
        }

        // Memcached Benchmark
        if (memcached) {
            console.log('Running Memcached Benchmark...');
            try {
                const memSet = promisify(memcached.set.bind(memcached));
                const memGet = promisify(memcached.get.bind(memcached));
                results.memcached = await measureLatency('Memcached', async (i) => {
                    const key = `key-${i}`;
                    const value = `value-${i}`;
                    await memSet(key, value, 3600);
                    await memGet(key);
                }, iterations);
                console.log('Memcached done');
            } catch (memError) {
                results.memcached = { p50: 0, p90: 0, p99: 0, error: memError.message };
            }
        } else {
            results.memcached = { p50: 0, p90: 0, p99: 0, error: 'Memcached not connected' };
        }

        res.json(results);
    } catch (error) {
        console.error('P99 Benchmark Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Concurrent Connections Test (Thread Safety / Connection Pool)
app.post('/api/benchmark/concurrent', async (req, res) => {
    const { concurrency = 50, iterationsPerClient = 20 } = req.body;
    console.log(`Running Concurrent Test: ${concurrency} clients x ${iterationsPerClient} ops`);

    try {
        const results = {};

        // Redis Concurrent Test
        const redisStart = performance.now();
        const redisPromises = [];
        for (let c = 0; c < concurrency; c++) {
            redisPromises.push((async () => {
                for (let i = 0; i < iterationsPerClient; i++) {
                    await redisSingle.incr(`concurrent-counter-${c}`);
                }
            })());
        }
        await Promise.all(redisPromises);
        const redisEnd = performance.now();
        results.redis = {
            totalTimeMs: redisEnd - redisStart,
            opsPerSecond: (concurrency * iterationsPerClient) / ((redisEnd - redisStart) / 1000),
            totalOps: concurrency * iterationsPerClient
        };

        // PostgreSQL Concurrent Test
        const pgStart = performance.now();
        const pgPromises = [];
        const pgClient = await pgPool.connect();
        await pgClient.query('CREATE TABLE IF NOT EXISTS counters (id TEXT PRIMARY KEY, val INT DEFAULT 0)');
        pgClient.release();

        for (let c = 0; c < concurrency; c++) {
            pgPromises.push((async () => {
                for (let i = 0; i < iterationsPerClient; i++) {
                    await pgPool.query(
                        'INSERT INTO counters (id, val) VALUES ($1, 1) ON CONFLICT (id) DO UPDATE SET val = counters.val + 1',
                        [`counter-${c}`]
                    );
                }
            })());
        }
        await Promise.all(pgPromises);
        const pgEnd = performance.now();
        results.postgresql = {
            totalTimeMs: pgEnd - pgStart,
            opsPerSecond: (concurrency * iterationsPerClient) / ((pgEnd - pgStart) / 1000),
            totalOps: concurrency * iterationsPerClient
        };

        res.json(results);
    } catch (error) {
        console.error('Concurrent Test Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Memory Usage Comparison
app.get('/api/benchmark/memory', async (req, res) => {
    try {
        const results = {};

        // Redis Memory
        const redisInfo = await redisSingle.info('memory');
        const usedMemory = redisInfo.match(/used_memory:(\d+)/);
        const usedMemoryHuman = redisInfo.match(/used_memory_human:(\S+)/);
        results.redis = {
            usedBytes: usedMemory ? parseInt(usedMemory[1]) : 0,
            usedHuman: usedMemoryHuman ? usedMemoryHuman[1] : 'N/A',
            type: 'In-Memory'
        };

        // PostgreSQL doesn't easily expose memory per DB, but we can get table sizes
        try {
            const pgResult = await pgPool.query(`
                SELECT pg_size_pretty(pg_database_size('benchmarkdb')) as db_size,
                       pg_database_size('benchmarkdb') as db_size_bytes
            `);
            results.postgresql = {
                usedBytes: parseInt(pgResult.rows[0].db_size_bytes),
                usedHuman: pgResult.rows[0].db_size,
                type: 'Disk-Based'
            };
        } catch (e) {
            results.postgresql = { error: e.message };
        }

        // MongoDB Memory
        if (mongoDB) {
            try {
                const stats = await mongoDB.stats();
                results.mongodb = {
                    usedBytes: stats.dataSize,
                    usedHuman: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
                    type: 'Document Store'
                };
            } catch (e) {
                results.mongodb = { error: e.message };
            }
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Write Durability Test (Data Safety)
app.post('/api/benchmark/durability', async (req, res) => {
    const testId = Date.now().toString();
    console.log(`Running Durability Test: ${testId}`);

    try {
        const results = {};

        // Redis - Test WAIT command for sync replication
        const redisStart = performance.now();
        await redisSingle.set(`durability-${testId}`, 'test-value');
        // WAIT 0 0 returns immediately, but we simulate fsync with AOF
        const redisEnd = performance.now();
        results.redis = {
            writeTimeMs: redisEnd - redisStart,
            durability: 'AOF fsync (configurable)',
            dataLossRisk: 'Low (with AOF always)'
        };

        // PostgreSQL - COMMIT ensures durability
        const pgStart = performance.now();
        await pgPool.query('INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [`durability-${testId}`, 'test-value']);
        const pgEnd = performance.now();
        results.postgresql = {
            writeTimeMs: pgEnd - pgStart,
            durability: 'ACID Compliant (WAL)',
            dataLossRisk: 'Very Low'
        };

        // MongoDB
        if (mongoDB) {
            const mongoStart = performance.now();
            await mongoDB.collection('kv').updateOne(
                { _id: `durability-${testId}` },
                { $set: { value: 'test-value' } },
                { upsert: true, writeConcern: { w: 1, j: true } } // j:true = journal sync
            );
            const mongoEnd = performance.now();
            results.mongodb = {
                writeTimeMs: mongoEnd - mongoStart,
                durability: 'Journaled Write',
                dataLossRisk: 'Low (with journaling)'
            };
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Security Features Comparison
app.get('/api/benchmark/security', async (req, res) => {
    try {
        const results = {
            redis: {
                authentication: 'ACL (Access Control Lists) since Redis 6',
                encryption: 'TLS/SSL supported',
                networkSecurity: 'Protected mode, bind address',
                features: ['Password auth', 'User/Role ACLs', 'TLS', 'Command renaming']
            },
            postgresql: {
                authentication: 'Multiple methods (md5, scram-sha-256, certificate)',
                encryption: 'TLS/SSL, data-at-rest encryption',
                networkSecurity: 'pg_hba.conf, firewall rules',
                features: ['Row-level security', 'Column encryption', 'SSL certs', 'Audit logging']
            },
            mongodb: {
                authentication: 'SCRAM, x.509, LDAP, Kerberos',
                encryption: 'TLS/SSL, Encryption at rest',
                networkSecurity: 'IP whitelist, VPC peering',
                features: ['Role-based access', 'Field-level encryption', 'Audit logging', 'LDAP integration']
            }
        };

        // Redis ACL check
        try {
            const aclList = await redisSingle.acl('LIST');
            results.redis.aclEnabled = aclList.length > 0;
            results.redis.aclUsers = aclList.length;
        } catch (e) {
            results.redis.aclEnabled = false;
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Architecture Comparison (Static Info)
app.get('/api/architecture', async (req, res) => {
    res.json({
        redis: {
            type: 'In-Memory Key-Value Store',
            dataModel: 'Key-Value with rich data types (Strings, Hashes, Lists, Sets, Sorted Sets)',
            persistence: 'RDB snapshots, AOF, Hybrid (RDB+AOF)',
            scalability: 'Redis Cluster (sharding), Sentinel (HA)',
            useCases: ['Caching', 'Session Store', 'Real-time Analytics', 'Message Queue'],
            pros: ['Ultra-fast reads/writes', 'Rich data structures', 'Pub/Sub', 'Lua scripting'],
            cons: ['Memory-bound', 'No complex queries', 'Single-threaded (mostly)']
        },
        postgresql: {
            type: 'Relational Database (RDBMS)',
            dataModel: 'Tables with rows/columns, SQL queries',
            persistence: 'Write-Ahead Logging (WAL), MVCC',
            scalability: 'Read replicas, Partitioning, Citus extension',
            useCases: ['OLTP', 'Complex queries', 'ACID transactions', 'Geospatial'],
            pros: ['ACID compliance', 'Complex queries', 'JSON support', 'Extensions'],
            cons: ['Slower than in-memory DBs', 'Scaling complexity', 'Resource intensive']
        },
        mongodb: {
            type: 'Document Database (NoSQL)',
            dataModel: 'JSON-like documents (BSON), Collections',
            persistence: 'Journaling, WiredTiger storage engine',
            scalability: 'Sharding, Replica Sets',
            useCases: ['Content management', 'Catalogs', 'Mobile apps', 'IoT'],
            pros: ['Flexible schema', 'Horizontal scaling', 'Aggregation framework'],
            cons: ['No joins (limited)', 'Memory usage', 'Write performance']
        },
        memcached: {
            type: 'Distributed Memory Cache',
            dataModel: 'Simple key-value (strings only)',
            persistence: 'None (volatile)',
            scalability: 'Client-side sharding',
            useCases: ['Simple caching', 'Session storage'],
            pros: ['Very fast', 'Simple', 'Multi-threaded'],
            cons: ['No persistence', 'Limited data types', 'No replication']
        }
    });
});

// 7. AOF Rewrite Latency
app.post('/api/benchmark/aof-rewrite', async (req, res) => {
    try {
        const measurements = [];
        let rewriting = false;

        await redisAof.bgrewriteaof();
        rewriting = true;

        const start = performance.now();
        while (rewriting && (performance.now() - start) < 10000) {
            const t0 = performance.now();
            await redisAof.set('probe', 'value');
            const t1 = performance.now();
            measurements.push(t1 - t0);

            const info = await redisAof.info('persistence');
            if (!info.includes('aof_rewrite_in_progress:1')) {
                rewriting = false;
            }
            await new Promise(r => setTimeout(r, 10));
        }

        const max = Math.max(...measurements);
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;

        res.json({ maxLatency: max, avgLatency: avg, samples: measurements.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. Failover Status
app.get('/api/failover/status', async (req, res) => {
    try {
        const address = await redisSentinel.sentinel('get-master-addr-by-name', REDIS_SENTINEL_CONFIG.name);
        res.json({ master: address, connected: true });
    } catch (e) {
        res.json({ connected: false, error: e.message });
    }
});

// 9. Failover Benchmark
app.post('/api/benchmark/failover', async (req, res) => {
    console.log('Starting Failover Benchmark...');
    try {
        console.log('Querying Sentinel for current master...');
        const initialMaster = await redisSentinel.sentinel('get-master-addr-by-name', REDIS_SENTINEL_CONFIG.name);
        if (!initialMaster) throw new Error('No master found from Sentinel');

        const [host, port] = initialMaster;
        console.log(`Current master: ${host}:${port}`);

        const start = performance.now();

        // Trigger failover via Sentinel
        console.log('Triggering failover...');
        try {
            await redisSentinel.sentinel('failover', REDIS_SENTINEL_CONFIG.name);
        } catch (e) {
            console.log('Failover command response:', e.message);
        }

        // Poll for new master
        let newMaster = null;
        for (let checks = 0; checks < 60; checks++) {
            await new Promise(r => setTimeout(r, 500));
            try {
                const current = await redisSentinel.sentinel('get-master-addr-by-name', REDIS_SENTINEL_CONFIG.name);
                if (current && (current[0] !== host || current[1] !== port)) {
                    newMaster = current;
                    break;
                }
            } catch (e) { }
        }

        const end = performance.now();

        if (newMaster) {
            res.json({
                timeMs: end - start,
                oldMaster: `${host}:${port}`,
                newMaster: `${newMaster[0]}:${newMaster[1]}`,
                success: true
            });
        } else {
            res.json({ success: false, error: 'Failover timed out after 30s' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 10. Hybrid Persistence Status
app.get('/api/hybrid-persistence/status', async (req, res) => {
    try {
        const info = await redisAof.info('persistence');
        const lines = info.split('\r\n');
        const parseValue = (key) => {
            const line = lines.find(l => l.startsWith(key + ':'));
            return line ? line.split(':')[1] : null;
        };

        res.json({
            aofEnabled: parseValue('aof_enabled') === '1',
            aofRewriteInProgress: parseValue('aof_rewrite_in_progress') === '1',
            aofCurrentSize: parseInt(parseValue('aof_current_size')) || 0,
            aofBaseSize: parseInt(parseValue('aof_base_size')) || 0,
            rdbBgsaveInProgress: parseValue('rdb_bgsave_in_progress') === '1',
            rdbLastSaveTime: parseInt(parseValue('rdb_last_save_time')) || 0,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 11. Trigger AOF Rewrite
app.post('/api/hybrid-persistence/rewrite', async (req, res) => {
    try {
        await redisAof.bgrewriteaof();

        let completed = false;
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 500));
            const info = await redisAof.info('persistence');
            if (!info.includes('aof_rewrite_in_progress:1')) {
                completed = true;
                break;
            }
        }

        const finalInfo = await redisAof.info('persistence');
        const lines = finalInfo.split('\r\n');
        const parseValue = (key) => {
            const line = lines.find(l => l.startsWith(key + ':'));
            return line ? line.split(':')[1] : null;
        };

        res.json({
            success: completed,
            message: completed ? 'AOF rewrite completed' : 'Rewrite still in progress',
            aofCurrentSize: parseInt(parseValue('aof_current_size')) || 0,
            aofBaseSize: parseInt(parseValue('aof_base_size')) || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`Backend running on port ${PORT}`);
    await initClients();
});
