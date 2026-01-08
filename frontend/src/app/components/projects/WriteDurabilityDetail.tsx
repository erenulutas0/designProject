import { Project } from '../../data/projectsData';
import { useState } from 'react';
import { Shield, Save, AlertTriangle, CheckCircle, Database, Server } from 'lucide-react';

interface Props {
    project: Project;
}

export function WriteDurabilityDetail({ project }: Props) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runBenchmark = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/benchmark/durability', {
                method: 'POST'
            });
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const dbs = [
        { key: 'redis', name: 'Redis (AOF)', icon: Database, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        { key: 'postgresql', name: 'PostgreSQL (WAL)', icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { key: 'mongodb', name: 'MongoDB (Journal)', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
                <div className="flex items-start gap-4">
                    <div className="bg-yellow-500 p-3 rounded-lg">
                        <Save className="h-8 w-8 text-zinc-900" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
                        <p className="text-zinc-300 text-lg">{project.description}</p>
                    </div>
                    <button
                        onClick={runBenchmark}
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${loading ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 hover:scale-105'
                            }`}
                    >
                        {loading ? <Save className="animate-spin h-5 w-5" /> : <Shield className="h-5 w-5" />}
                        {loading ? 'Testing Durability...' : 'Test Data Safety'}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {dbs.map(db => (
                    <div key={db.key} className={`bg-zinc-800/50 border ${db.border} rounded-lg p-6 relative overflow-hidden transition-all hover:bg-zinc-800`}>
                        {results && results[db.key] && (
                            <div className="absolute top-0 right-0 p-4">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-6">
                            <db.icon className={`h-6 w-6 ${db.color}`} />
                            <h3 className={`text-xl font-bold ${db.color}`}>{db.name}</h3>
                        </div>

                        {results && results[db.key] ? (
                            <div className="space-y-4">
                                <div className="bg-zinc-900/50 p-4 rounded border border-zinc-700">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Write Time</div>
                                    <div className="text-2xl font-mono text-white">
                                        {results[db.key].writeTimeMs.toFixed(2)} <span className="text-sm text-zinc-400">ms</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Mechanism:</span>
                                        <span className="text-zinc-200">{results[db.key].durability}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Risk Level:</span>
                                        <span className="text-green-400">{results[db.key].dataLossRisk}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded">
                                <Shield className="h-8 w-8 mb-2 opacity-50" />
                                <div className="text-sm">Waiting for test...</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                <div className="flex items-start gap-4 text-zinc-400">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                    <p className="text-sm leading-relaxed">
                        <strong>Note:</strong> This benchmark simulates safe writes with typical durability configurations in a Docker environment.
                        Redis uses AOF with fsync. PostgreSQL uses WAL with commit confirmation. MongoDB uses Journaling with write concern.
                        Lower write time is better, but data safety is the priority here.
                    </p>
                </div>
            </div>
        </div>
    );
}
