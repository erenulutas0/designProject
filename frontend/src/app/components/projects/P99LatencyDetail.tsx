import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Server, Database, Layers, Box, Archive, Zap, AlertCircle, Loader2, Cpu, MemoryStick, Settings, Terminal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BenchmarkResult {
  p50: number;
  p90: number;
  p99: number;
}

interface LiveData {
  postgresql: BenchmarkResult;
  redis: BenchmarkResult;
  redisCluster: BenchmarkResult;
  mongodb: BenchmarkResult;
  memcached: BenchmarkResult;
}

interface Scenario {
  id: string;
  label: string;
  description: string;
  iterations: number;
  payloadSize: number;
}

const SCENARIOS: Scenario[] = [
  { id: 'tiny', label: 'Tiny Load', description: '200 ops, 10 bytes', iterations: 200, payloadSize: 10 },
  { id: 'small', label: 'Small Load', description: '1K ops, 100 bytes', iterations: 1000, payloadSize: 100 },
  { id: 'medium', label: 'Medium Load', description: '10K ops, 1KB payload', iterations: 10000, payloadSize: 1024 },
  { id: 'high', label: 'High Load', description: '100K ops, 1KB payload (Parallel)', iterations: 100000, payloadSize: 1024 },
];

export const P99LatencyDetail: React.FC = () => {
  const [resultsMap, setResultsMap] = useState<Record<string, LiveData>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorsMap, setErrorsMap] = useState<Record<string, string | null>>({});
  const [expanded, setExpanded] = useState<string | null>('small');
  const [systemSpecs, setSystemSpecs] = useState<any>(null);

  useEffect(() => {
    fetch('/api/system-specs')
      .then(res => res.json())
      .then(setSystemSpecs)
      .catch(err => console.error('Failed to fetch specs:', err));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const runBenchmark = async (scenario: Scenario, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setLoadingMap(prev => ({ ...prev, [scenario.id]: true }));
    setErrorsMap(prev => ({ ...prev, [scenario.id]: null }));

    try {
      const res = await fetch('/api/benchmark/p99', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payloadSize: scenario.payloadSize,
          iterations: scenario.iterations
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      setResultsMap(prev => ({
        ...prev,
        [scenario.id]: {
          postgresql: result.postgresql,
          redis: result.redis,
          redisCluster: result.redisCluster,
          mongodb: result.mongodb,
          memcached: result.memcached
        }
      }));
    } catch (err: any) {
      setErrorsMap(prev => ({ ...prev, [scenario.id]: err.message }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [scenario.id]: false }));
    }
  };

  const getChartData = (data: LiveData) => [
    {
      metric: 'p50',
      Postgres: data.postgresql.p50,
      Redis: data.redis.p50,
      Cluster: data.redisCluster.p50,
      MongoDB: data.mongodb.p50,
      Memcached: data.memcached.p50
    },
    {
      metric: 'p99',
      Postgres: data.postgresql.p99,
      Redis: data.redis.p99,
      Cluster: data.redisCluster.p99,
      MongoDB: data.mongodb.p99,
      Memcached: data.memcached.p99
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          P99 Latency & Concurrency Benchmarks
        </h2>
        <p className="text-zinc-400 mb-6">
          Compare tail latency (p99) across different scenarios. Higher iterations show stability under load.
          <br />
          <span className="text-xs text-zinc-500 ml-1">Results in milliseconds (lower is better).</span>
        </p>

        <div className="grid grid-cols-1 gap-4">
          {SCENARIOS.map(scenario => {
            const result = resultsMap[scenario.id];
            const isLoading = loadingMap[scenario.id];
            const error = errorsMap[scenario.id];
            const isExpanded = expanded === scenario.id;

            return (
              <div key={scenario.id} className={`border rounded-lg transition-all duration-200 ${isExpanded ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleExpand(scenario.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{scenario.label}</h3>
                      <p className="text-sm text-zinc-500">{scenario.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {result && !isLoading && (
                      <span className="text-xs px-2 py-1 bg-green-900/20 text-green-400 border border-green-900/30 rounded">
                        Done
                      </span>
                    )}
                    {error && (
                      <span className="text-xs px-2 py-1 bg-red-900/20 text-red-400 border border-red-900/30 rounded flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                    <button
                      onClick={(e) => runBenchmark(scenario, e)}
                      disabled={isLoading}
                      className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                      title="Run Benchmark"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-zinc-800/50 mt-2">
                    {error && (
                      <div className="mb-4 p-3 bg-red-900/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {!result && !isLoading && !error && (
                      <div className="h-32 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg">
                        <Zap className="h-8 w-8 mb-2 opacity-50 text-yellow-500/50" />
                        <p className="text-sm mb-3">Ready to start {scenario.label}</p>
                        <button
                          onClick={(e) => runBenchmark(scenario, e)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
                        >
                          Start Benchmark
                        </button>
                      </div>
                    )}

                    {isLoading && !result && (
                      <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-500" />
                        <p>Running concurrent benchmarks...</p>
                        <p className="text-xs mt-1 opacity-60">Testing Postgres, Redis, Mongo, Memcached...</p>
                      </div>
                    )}

                    {result && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                        {/* Chart */}
                        <div className="lg:col-span-2 h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getChartData(result)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="metric" stroke="#666" />
                              <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => `${val}ms`} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                formatter={(value: number) => [`${value.toFixed(3)}ms`, 'Latency']}
                              />
                              <Legend />
                              <Bar dataKey="Redis" fill="#22c55e" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="Memcached" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="Cluster" fill="#a855f7" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="MongoDB" fill="#10b981" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="Postgres" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Stats Cards */}
                        <div className="lg:col-span-1 space-y-3">
                          {[
                            { name: 'Redis', data: result.redis, color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-900/10', icon: Server },
                            { name: 'Memcached', data: result.memcached, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-900/10', icon: Box },
                            { name: 'Cluster', data: result.redisCluster, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-900/10', icon: Layers },
                            { name: 'MongoDB', data: result.mongodb, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', icon: Archive },
                            { name: 'Postgres', data: result.postgresql, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-900/10', icon: Database },
                          ].map(db => (
                            <div key={db.name} className={`flex items-center justify-between p-3 rounded-lg border ${db.border} ${db.bg}`}>
                              <div className="flex items-center gap-2">
                                <db.icon className={`h-4 w-4 ${db.color}`} />
                                <span className="text-sm font-medium text-zinc-300">{db.name}</span>
                              </div>
                              <div className="flex gap-4">
                                <div className="text-right">
                                  <div className={`text-sm font-bold ${db.color} opacity-80`}>{db.data.p50.toFixed(2)}ms</div>
                                  <div className="text-[10px] text-zinc-500">p50</div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-sm font-bold ${db.color}`}>{db.data.p99.toFixed(2)}ms</div>
                                  <div className="text-[10px] text-zinc-500">p99</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-400" />
          Benchmark Environment & Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hardware Specs */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Hardware
            </h4>
            <div className="space-y-2">
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">CPU Model</div>
                <div className="text-sm text-zinc-300 font-mono">{systemSpecs?.cpu?.model || 'Loading...'}</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Cores</div>
                <div className="text-sm text-zinc-300 font-mono">{systemSpecs?.cpu?.cores || '-'} Cores</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Total RAM</div>
                <div className="text-sm text-zinc-300 font-mono">{systemSpecs ? (systemSpecs.ram.total / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'Loading...'}</div>
              </div>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Deployment
            </h4>
            <div className="space-y-2">
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Node Type</div>
                <div className="text-sm text-zinc-300">Single-Node (Localhost)</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Network</div>
                <div className="text-sm text-zinc-300">Docker Host Networking (TCP)</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">OS Platform</div>
                <div className="text-sm text-zinc-300 font-mono">{systemSpecs?.os?.platform || 'Unknown'} ({systemSpecs?.os?.release || '-'})</div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Settings className="h-4 w-4" /> Configuration
            </h4>
            <div className="space-y-2">
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Redis Persistence</div>
                <div className="text-sm text-zinc-300">AOF Enabled (Append Only)</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">MongoDB Write Concern</div>
                <div className="text-sm text-zinc-300">Default (w:1 / Journaled)</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Postgres Pool Size</div>
                <div className="text-sm text-zinc-300">Default (Min: 0, Max: 10)</div>
              </div>
            </div>
          </div>

          {/* Methodology */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <MemoryStick className="h-4 w-4" /> Methodology
            </h4>
            <div className="space-y-2">
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Benchmark Tool</div>
                <div className="text-sm text-zinc-300">Custom Node.js (hdr-histogram)</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Concurrency</div>
                <div className="text-sm text-zinc-300">Batch Size: 50 (Parallel)</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="text-xs text-zinc-500">Warm-up</div>
                <div className="text-sm text-zinc-300">None (Cold Start)</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


