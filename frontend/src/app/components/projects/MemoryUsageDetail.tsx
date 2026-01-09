import { Project } from '../../data/projectsData';
import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Database } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
    project: Project;
}

export function MemoryUsageDetail({ project }: Props) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const fetchMemoryStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/benchmark/memory');
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemoryStats();
    }, []);

    const data = results ? [
        { name: 'Redis', value: results.redis?.usedBytes || 0, human: results.redis?.usedHuman, color: '#ef4444' },
        { name: 'Redis Cluster', value: results.redisCluster?.usedBytes || 0, human: results.redisCluster?.usedHuman, color: '#f97316' },
        { name: 'Memcached', value: results.memcached?.usedBytes || 0, human: results.memcached?.usedHuman, color: '#06b6d4' },
        { name: 'PostgreSQL', value: results.postgresql?.usedBytes || 0, human: results.postgresql?.usedHuman, color: '#3b82f6' },
        { name: 'MongoDB', value: results.mongodb?.usedBytes || 0, human: results.mongodb?.usedHuman, color: '#10b981' }
    ].filter(i => i.value > 0) : [];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
                <div className="flex items-start gap-4">
                    <div className="bg-yellow-500 p-3 rounded-lg">
                        <Cpu className="h-8 w-8 text-zinc-900" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
                        <p className="text-zinc-300 text-lg">{project.description}</p>
                    </div>
                    <button
                        onClick={fetchMemoryStats}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition-all"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Stats
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Chart Section */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 min-h-[400px]">
                    <h3 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center gap-2">
                        <Database className="h-5 w-5 text-yellow-500" />
                        Memory Distribution
                    </h3>
                    {results ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                                        formatter={(value: number, name: string, props: any) => [props.payload.human, name]}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-zinc-500">Loading...</div>
                    )}
                </div>

                {/* Details Table */}
                <div className="space-y-4">
                    {data.map((item) => (
                        <div key={item.name} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-12 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">{item.name}</h4>
                                    <span className="text-zinc-400 text-sm">
                                        {item.name === 'Redis' ? 'In-Memory Key-Value' :
                                            item.name === 'PostgreSQL' ? 'Relational (Disk)' :
                                                item.name === 'MongoDB' ? 'Document Store' : 'Memory Cache'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-mono text-white">{item.human}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-widest">Used Memory</div>
                            </div>
                        </div>
                    ))}

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
                        <p className="text-blue-400 text-sm">
                            <strong>Analysis:</strong> Redis typically uses more RAM for the same dataset compared to disk-based databases like PostgreSQL, but offers sub-millisecond access times. PostgreSQL caches data in OS memory (buffers), which is not fully reflected in "Database Size".
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
