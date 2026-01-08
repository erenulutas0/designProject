import { Project } from '../../data/projectsData';
import { Database, Server, Layers, Archive, Box, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
    project: Project;
}

export function ArchitectureComparisonDetail({ project }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/architecture')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-zinc-400">Loading architecture data...</div>;

    const dbs = [
        { key: 'redis', name: 'Redis', icon: Server, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { key: 'postgresql', name: 'PostgreSQL', icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { key: 'mongodb', name: 'MongoDB', icon: Archive, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { key: 'memcached', name: 'Memcached', icon: Box, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
                <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
                <p className="text-zinc-300 text-lg">{project.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {dbs.map(db => (
                    <div key={db.key} className={`rounded-lg border p-6 ${db.bg} ${db.border}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <db.icon className={`h-6 w-6 ${db.color}`} />
                            <h2 className={`text-xl font-bold ${db.color}`}>{db.name}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Architecture</h3>
                                <p className="text-zinc-200">{data[db.key].type}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Use Cases</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data[db.key].useCases.map((uc: string) => (
                                        <span key={uc} className="px-2 py-1 bg-zinc-900/50 rounded text-xs text-zinc-300 border border-zinc-700">{uc}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-1">Pros</h3>
                                    <ul className="space-y-1">
                                        {data[db.key].pros.map((pro: string) => (
                                            <li key={pro} className="flex items-start gap-2 text-sm text-zinc-300">
                                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{pro}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-1">Cons</h3>
                                    <ul className="space-y-1">
                                        {data[db.key].cons.map((con: string) => (
                                            <li key={con} className="flex items-start gap-2 text-sm text-zinc-300">
                                                <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                                <span>{con}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
