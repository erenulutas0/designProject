const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files (dashboard.html)
app.use(express.static(__dirname));

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

// Helper function to execute docker commands
async function dockerExec(container, command) {
    try {
        const { stdout } = await execAsync(`docker exec ${container} ${command}`);
        return stdout.trim();
    } catch (error) {
        console.error(`Error executing command: ${error.message}`);
        return null;
    }
}

// Parse Redis INFO persistence output
function parsePersistenceInfo(info) {
    const lines = info.split('\n');
    const data = {};
    
    lines.forEach(line => {
        if (line.includes(':')) {
            const [key, value] = line.split(':');
            data[key.trim()] = value.trim();
        }
    });
    
    return data;
}

// Get AOF file info (Redis 7.0+ uses appendonlydir structure)
async function getAOFInfo(container) {
    try {
        // Redis 7.0+ uses appendonlydir structure
        const manifestExists = await dockerExec(container, 'sh -c "test -f /data/appendonlydir/appendonly.aof.manifest && echo yes || echo no"');
        
        if (manifestExists !== 'yes') {
            // Try old format (Redis < 7.0)
            const oldFormatExists = await dockerExec(container, 'sh -c "test -f /data/appendonly.aof && echo yes || echo no"');
            if (oldFormatExists !== 'yes') {
                return { exists: false, hasRDBPreamble: false, size: 0, baseSize: 0, incrSize: 0 };
            }
            
            // Old format - single AOF file
            const sizeOutput = await dockerExec(container, 'sh -c "stat -c%s /data/appendonly.aof 2>/dev/null || echo 0"');
            const size = parseInt(sizeOutput) || 0;
            const firstBytes = await dockerExec(container, 'sh -c "head -c 5 /data/appendonly.aof 2>/dev/null"');
            const hasRDBPreamble = firstBytes === 'REDIS';
            
            return {
                exists: true,
                hasRDBPreamble,
                size,
                baseSize: hasRDBPreamble ? size : 0,
                incrSize: 0
            };
        }
        
        // Redis 7.0+ format - parse manifest to find actual file names
        // Use sh -c to properly handle shell commands in Windows
        const manifestContent = await dockerExec(container, 'sh -c "cat /data/appendonlydir/appendonly.aof.manifest 2>/dev/null"');
        
        let baseFile = null;
        let incrFile = null;
        let hasRDBPreamble = false;
        
        if (manifestContent) {
            const lines = manifestContent.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.includes('base.rdb')) {
                    // Format: "file appendonly.aof.2.base.rdb seq 2 type b"
                    const parts = trimmedLine.split(/\s+/);
                    if (parts.length >= 2 && parts[0] === 'file') {
                        baseFile = parts[1];
                        hasRDBPreamble = true;
                    }
                } else if (trimmedLine.includes('incr.aof')) {
                    // Format: "file appendonly.aof.2.incr.aof seq 2 type i"
                    const parts = trimmedLine.split(/\s+/);
                    if (parts.length >= 2 && parts[0] === 'file') {
                        incrFile = parts[1];
                    }
                }
            }
        }
        
        // Also check if base.rdb file exists directly (fallback)
        if (!hasRDBPreamble) {
            // Use sh -c with proper shell command
            const baseFilesList = await dockerExec(container, 'sh -c "ls /data/appendonlydir/*.base.rdb 2>/dev/null"');
            if (baseFilesList && baseFilesList.trim()) {
                // Get first file from the list
                const files = baseFilesList.trim().split('\n');
                if (files.length > 0 && files[0]) {
                    baseFile = files[0].trim().split('/').pop();
                    hasRDBPreamble = true;
                }
            }
        }
        
        // Get base.rdb size (RDB preamble)
        let baseSize = 0;
        if (baseFile) {
            const baseSizeOutput = await dockerExec(container, `sh -c "stat -c%s /data/appendonlydir/${baseFile} 2>/dev/null || echo 0"`);
            baseSize = parseInt(baseSizeOutput) || 0;
        }
        
        // Get incr.aof size (AOF commands)
        let incrSize = 0;
        if (incrFile) {
            const incrSizeOutput = await dockerExec(container, `sh -c "stat -c%s /data/appendonlydir/${incrFile} 2>/dev/null || echo 0"`);
            incrSize = parseInt(incrSizeOutput) || 0;
        }
        
        const totalSize = baseSize + incrSize;
        
        return {
            exists: true,
            hasRDBPreamble,
            size: totalSize,
            baseSize,
            incrSize
        };
    } catch (error) {
        console.error('Error getting AOF info:', error);
        return { exists: false, hasRDBPreamble: false, size: 0, baseSize: 0, incrSize: 0 };
    }
}

// API Routes
app.get('/api/redis-info', async (req, res) => {
    try {
        const container = 'redis-hybrid';
        
        // Get persistence info
        const persistenceInfo = await dockerExec(container, 'redis-cli INFO persistence');
        const parsed = parsePersistenceInfo(persistenceInfo);
        
        // Get aof-use-rdb-preamble from CONFIG (not in INFO persistence in Redis 7.0)
        const aofUseRdbPreamble = await dockerExec(container, 'redis-cli CONFIG GET aof-use-rdb-preamble');
        let aofUseRdbPreambleValue = '0';
        if (aofUseRdbPreamble) {
            const lines = aofUseRdbPreamble.split('\n');
            for (const line of lines) {
                if (line.trim() === 'yes' || line.trim() === '1') {
                    aofUseRdbPreambleValue = '1';
                    break;
                }
            }
        }
        
        // Get AOF file info
        const aofInfo = await getAOFInfo(container);
        
        // Combine data
        const response = {
            aof_enabled: parsed.aof_enabled || '0',
            aof_use_rdb_preamble: aofUseRdbPreambleValue,
            aof_current_size: parsed.aof_current_size || '0',
            aof_base_size: parsed.aof_base_size || String(aofInfo.baseSize || 0),
            aof_rewrite_in_progress: parsed.aof_rewrite_in_progress || '0',
            aof_last_rewrite_time_sec: parsed.aof_last_rewrite_time_sec || '0',
            rdb_last_save_time: parsed.rdb_last_save_time || '0',
            has_rdb_preamble: aofInfo.hasRDBPreamble,
            aof_file_size: aofInfo.size,
            aof_base_file_size: aofInfo.baseSize,
            aof_incr_file_size: aofInfo.incrSize
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/redis-stats', async (req, res) => {
    try {
        const container = 'redis-hybrid';
        
        // Get server info
        const serverInfo = await dockerExec(container, 'redis-cli INFO server');
        const memoryInfo = await dockerExec(container, 'redis-cli INFO memory');
        const statsInfo = await dockerExec(container, 'redis-cli INFO stats');
        
        // Parse basic stats
        const dbSize = await dockerExec(container, 'redis-cli DBSIZE');
        
        res.json({
            dbSize: parseInt(dbSize) || 0,
            serverInfo: parsePersistenceInfo(serverInfo),
            memoryInfo: parsePersistenceInfo(memoryInfo),
            statsInfo: parsePersistenceInfo(statsInfo)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/trigger-rewrite', async (req, res) => {
    try {
        const container = 'redis-hybrid';
        const result = await dockerExec(container, 'redis-cli BGREWRITEAOF');
        res.json({ success: true, message: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Redis Visualization API Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`📊 Or open: http://localhost:${PORT}/`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET  /api/redis-info - Get persistence info`);
    console.log(`  GET  /api/redis-stats - Get Redis statistics`);
    console.log(`  POST /api/trigger-rewrite - Trigger AOF rewrite`);
    console.log(`  GET  /api/health - Health check`);
});

