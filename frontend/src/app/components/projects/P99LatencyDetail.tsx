import { Project } from '../../data/projectsData';
import { Zap, TrendingUp, Play, RefreshCw, AlertCircle, Database, Server, Layers, Archive, Box } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface Props {
  project: Project;
}

interface BenchmarkResult {
  p50: number;
  p90: number;
  p99: number;
  error?: string;
}

interface LiveData {
  postgresql: BenchmarkResult;
  redis: BenchmarkResult;
  redisCluster: BenchmarkResult;
  mongodb: BenchmarkResult;
  memcached: BenchmarkResult;
}

export function P99LatencyDetail({ project }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/benchmark/p99', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iterations: 200 })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Benchmark failed');
      }
      const result = await res.json();
      setLiveData({
        postgresql: result.postgresql,
        redis: result.redis,
        redisCluster: result.redisCluster,
        mongodb: result.mongodb,
        memcached: result.memcached
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = liveData ? [
    {
      metric: 'p50',
      PostgreSQL: liveData.postgresql.p50,
      Redis: liveData.redis.p50,
      MongoDB: liveData.mongodb.p50,
      Memcached: liveData.memcached.p50
    },
    {
      metric: 'p99',
      PostgreSQL: liveData.postgresql.p99,
      Redis: liveData.redis.p99,
      MongoDB: liveData.mongodb.p99,
      Memcached: liveData.memcached.p99
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg">
            <Zap className="h-8 w-8 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
            <p className="text-zinc-300 text-lg">{project.description}</p>
          </div>
          <button
            onClick={runBenchmark}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${loading
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 hover:scale-105'
              }`}
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {loading ? 'Running Benchmark...' : 'Run Live Benchmark (Multi-DB)'}
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* No Data State */}
      {!liveData && !loading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <Play className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Ready to Benchmark</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Click "Run Live Benchmark" to measure latency differences between PostgreSQL, Redis, Redis Cluster, MongoDB, and Memcached.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Running Multi-Database Benchmark...</h3>
          <p className="text-zinc-400">Testing operational latency across SQL, NoSQL, and In-Memory stores.</p>
        </div>
      )}

      {/* Live Results */}
      {liveData && !loading && (
        <>
          {/* Benchmark Results Grid */}
          <div className="grid md:grid-cols-5 gap-4">
            {/* Redis */}
            <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-green-400">Redis</h3>
              </div>
              <div className="space-y-2">
                <div><span className="text-xs text-zinc-400">P50:</span> <span className="font-mono font-bold text-green-400">{liveData.redis.p50.toFixed(2)}ms</span></div>
                <div><span className="text-xs text-zinc-400">P99:</span> <span className="font-mono font-bold text-green-400">{liveData.redis.p99.toFixed(2)}ms</span></div>
              </div>
            </div>

            {/* Memcached */}
            <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Box className="h-5 w-5 text-cyan-500" />
                <h3 className="font-semibold text-cyan-400">Memcached</h3>
              </div>
              <div className="space-y-2">
                <div><span className="text-xs text-zinc-400">P50:</span> <span className="font-mono font-bold text-cyan-400">{liveData.memcached.p50.toFixed(2)}ms</span></div>
                <div><span className="text-xs text-zinc-400">P99:</span> <span className="font-mono font-bold text-cyan-400">{liveData.memcached.p99.toFixed(2)}ms</span></div>
              </div>
            </div>

            {/* Redis Cluster */}
            <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-purple-400">Cluster</h3>
              </div>
              <div className="space-y-2">
                <div><span className="text-xs text-zinc-400">P50:</span> <span className="font-mono font-bold text-purple-400">{liveData.redisCluster.p50.toFixed(2)}ms</span></div>
                <div><span className="text-xs text-zinc-400">P99:</span> <span className="font-mono font-bold text-purple-400">{liveData.redisCluster.p99.toFixed(2)}ms</span></div>
              </div>
            </div>

            {/* MongoDB */}
            <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Archive className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-emerald-400">MongoDB</h3>
              </div>
              <div className="space-y-2">
                <div><span className="text-xs text-zinc-400">P50:</span> <span className="font-mono font-bold text-emerald-400">{liveData.mongodb.p50.toFixed(2)}ms</span></div>
                <div><span className="text-xs text-zinc-400">P99:</span> <span className="font-mono font-bold text-emerald-400">{liveData.mongodb.p99.toFixed(2)}ms</span></div>
              </div>
            </div>

            {/* PostgreSQL */}
            <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-blue-400">Postgres</h3>
              </div>
              <div className="space-y-2">
                <div><span className="text-xs text-zinc-400">P50:</span> <span className="font-mono font-bold text-blue-400">{liveData.postgresql.p50.toFixed(2)}ms</span></div>
                <div><span className="text-xs text-zinc-400">P99:</span> <span className="font-mono font-bold text-blue-400">{liveData.postgresql.p99.toFixed(2)}ms</span></div>
              </div>
            </div>
          </div>

          {/* Latency Comparison Chart */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-zinc-100">Latency Comparison (Lower is Better)</h2>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="metric" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} />
                  <YAxis
                    stroke="#a1a1aa"
                    tick={{ fill: '#a1a1aa' }}
                    label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#eab308' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#fafafa' }}
                    cursor={{ fill: '#3f3f46', opacity: 0.2 }}
                  />
                  <Legend />
                  <Bar dataKey="Redis" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Memcached" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="MongoDB" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PostgreSQL" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
