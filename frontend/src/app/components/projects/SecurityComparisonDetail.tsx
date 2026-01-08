import { Project } from '../../data/projectsData';
import { Shield, Lock, Globe, Key, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
    project: Project;
}

export function SecurityComparisonDetail({ project }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/benchmark/security')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-zinc-400">Loading security analysis...</div>;

    if (!data) {
        return (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-red-500">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-bold">Connection Error</span>
                </div>
                Could not fetch security data. Ensure the backend is running at port 3001.
            </div>
        );
    }

    const sections = [
        { key: 'redis', name: 'Redis', color: 'green' },
        { key: 'postgresql', name: 'PostgreSQL', color: 'blue' },
        { key: 'mongodb', name: 'MongoDB', color: 'emerald' }
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
                <div className="flex items-center gap-4">
                    <Shield className="h-8 w-8 text-yellow-500" />
                    <div>
                        <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
                        <p className="text-zinc-300 text-lg">{project.description}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {sections.map(sec => (
                    <div key={sec.key} className={`bg-zinc-900/50 border border-${sec.color}-500/30 rounded-lg p-6`}>
                        <div className={`flex items-center gap-3 mb-6 border-b border-${sec.color}-500/20 pb-4`}>
                            <h2 className={`text-2xl font-bold text-${sec.color}-500`}>{sec.name} Security Profile</h2>
                            {sec.key === 'redis' && data?.redis?.aclEnabled && (
                                <span className="px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded">ACL ENABLED</span>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                                    <Key className="h-4 w-4" />
                                    <span className="text-sm uppercase tracking-wider">Authentication</span>
                                </div>
                                <p className="text-zinc-200">{data[sec.key].authentication}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                                    <Lock className="h-4 w-4" />
                                    <span className="text-sm uppercase tracking-wider">Encryption</span>
                                </div>
                                <p className="text-zinc-200">{data[sec.key].encryption}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                                    <Globe className="h-4 w-4" />
                                    <span className="text-sm uppercase tracking-wider">Network</span>
                                </div>
                                <p className="text-zinc-200">{data[sec.key].networkSecurity}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <span className="text-sm text-zinc-500 uppercase tracking-widest block mb-3">Key Features</span>
                            <div className="flex flex-wrap gap-2">
                                {data[sec.key].features.map((f: string) => (
                                    <span key={f} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm border border-zinc-700">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
