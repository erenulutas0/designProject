import { Project } from '../../data/projectsData';
import { useState } from 'react';
import { Users, Zap, Play, Activity, Settings, Database, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    project: Project;
}

export function ConcurrentConnectionsDetail({ project }: Props) {
    const [concurrency, setConcurrency] = useState(50);
    const [iterations, setIterations] = useState(100);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runBenchmark = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/benchmark/concurrent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concurrency, iterations })
            });
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const chartData = results ? [
        { name: 'Redis', ops: results.redis?.opsPerSecond || 0, color: '#ef4444' },
        { name: 'Redis Cluster', ops: results.redisCluster?.opsPerSecond || 0, color: '#a855f7' },
        { name: 'Memcached', ops: results.memcached?.opsPerSecond || 0, color: '#06b6d4' },
        { name: 'MongoDB', ops: results.mongodb?.opsPerSecond || 0, color: '#10b981' },
        { name: 'PostgreSQL', ops: results.postgresql?.opsPerSecond || 0, color: '#3b82f6' }
    ].sort((a, b) => b.ops - a.ops) : [];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
                <div className="flex items-start gap-4">
                    <div className="bg-yellow-500 p-3 rounded-lg">
                        <Users className="h-8 w-8 text-zinc-900" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
                        <p className="text-zinc-300 text-lg">{project.description}</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Settings className="h-5 w-5 text-yellow-500" />
                            <h3 className="text-xl font-semibold text-zinc-100">Configuration</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Concurrency (Clients)</label>
                                <input
                                    type="number"
                                    value={concurrency}
                                    onChange={(e) => setConcurrency(parseInt(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white focus:border-yellow-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Iterations per Client</label>
                                <input
                                    type="number"
                                    value={iterations}
                                    onChange={(e) => setIterations(parseInt(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white focus:border-yellow-500 outline-none transition"
                                />
                            </div>
                            <button
                                onClick={runBenchmark}
                                disabled={loading}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${loading ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900'
                                    }`}
                            >
                                {loading ? <Activity className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
                                {loading ? 'Running Stress Test...' : 'Start Benchmark'}
                            </button>
                        </div>
                    </div>

                    {results && (
                        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                            <h4 className="text-zinc-400 mb-4 uppercase text-xs font-bold tracking-wider">Results Summary</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded">
                                    <span className="text-red-400 font-semibold">Redis</span>
                                    <span className="text-white font-mono">{Math.round(results.redis?.opsPerSecond || 0).toLocaleString()} ops/sec</span>
                                </div>
                                {results.redisCluster && (
                                    <div className="flex justify-between items-center p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                                        <span className="text-purple-400 font-semibold">Redis Cluster</span>
                                        <span className="text-white font-mono">{Math.round(results.redisCluster?.opsPerSecond || 0).toLocaleString()} ops/sec</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                                    <span className="text-cyan-400 font-semibold">Memcached</span>
                                    <span className="text-white font-mono">{Math.round(results.memcached?.opsPerSecond || 0).toLocaleString()} ops/sec</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                    <span className="text-emerald-400 font-semibold">MongoDB</span>
                                    <span className="text-white font-mono">{Math.round(results.mongodb?.opsPerSecond || 0).toLocaleString()} ops/sec</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                                    <span className="text-blue-400 font-semibold">PostgreSQL</span>
                                    <span className="text-white font-mono">{Math.round(results.postgresql?.opsPerSecond || 0).toLocaleString()} ops/sec</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 min-h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="h-5 w-5 text-yellow-500" />
                        <h3 className="text-xl font-semibold text-zinc-100">Throughput Analysis (Ops/Sec)</h3>
                    </div>
                    {results ? (
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                    <XAxis type="number" stroke="#666" tickFormatter={(val) => `${val / 1000}k`} />
                                    <YAxis dataKey="name" type="category" stroke="#fff" width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333' }}
                                        formatter={(val: number) => [`${Math.round(val).toLocaleString()} ops/sec`, 'Throughput']}
                                    />
                                    <Bar dataKey="ops" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                            <BarChart2 className="h-16 w-16 mb-4" />
                            <p>Run benchmark to see visualization</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
