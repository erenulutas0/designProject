import { Project } from '../../data/projectsData';
import { Workflow, Zap, CheckCircle2, Play, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  project: Project;
}

export function EventDrivenDetail({ project }: Props) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/microservice/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCount: 1000 })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg">
            <Workflow className="h-8 w-8 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
            <p className="text-zinc-300 text-lg">{project.description}</p>
          </div>
          <button
            onClick={runSimulation}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${loading ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 hover:scale-105'
              }`}
          >
            {loading ? <Activity className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
            {loading ? 'Processing Orders...' : 'Simulate Pipeline'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {results && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-sm text-zinc-400">Total Orders</div>
            </div>
            <div className="text-3xl font-bold text-green-400">{results.summary.totalOrders}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-zinc-400">Throughput</div>
            </div>
            <div className="text-3xl font-bold text-blue-400">{results.summary.overallThroughput} <span className="text-lg">ops/s</span></div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div className="text-sm text-zinc-400">Total Time</div>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{results.summary.totalTimeMs} <span className="text-lg">ms</span></div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Workflow className="h-5 w-5 text-purple-500" />
              <div className="text-sm text-zinc-400">Services</div>
            </div>
            <div className="text-3xl font-bold text-purple-400">{results.streamInfo.consumerGroups}</div>
          </div>
        </div>
      )}

      {/* Service Metrics */}
      {results && (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(results.services).map(([serviceName, metrics]: [string, any]) => (
            <div key={serviceName} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${serviceName === 'inventory' ? 'bg-green-500' :
                  serviceName === 'payment' ? 'bg-blue-500' :
                    serviceName === 'notification' ? 'bg-yellow-500' :
                      'bg-purple-500'
                  }`}>
                  <Workflow className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 capitalize">{serviceName} Service</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">Processed</div>
                  <div className="text-2xl font-bold text-green-400">{metrics.processed}</div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">Failed</div>
                  <div className="text-2xl font-bold text-red-400">{metrics.failed}</div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">Throughput</div>
                  <div className="text-2xl font-bold text-blue-400">{metrics.throughput} <span className="text-sm">ops/s</span></div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-yellow-400">{metrics.successRate}%</div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">PEL Size</div>
                  <div className="text-2xl font-bold text-purple-400">{metrics.pelSize}</div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">Processing Time</div>
                  <div className="text-2xl font-bold text-zinc-300">{metrics.processingTimeMs}ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Architecture Overview */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6">Pipeline Architecture</h2>
        <div className="grid md:grid-cols-5 gap-4">
          {['Producer', 'Inventory', 'Payment', 'Notification', 'Analytics'].map((component, index) => (
            <div
              key={component}
              className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 text-center group hover:border-yellow-500/50 transition-colors"
            >
              <div className="bg-yellow-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-500/20 transition-colors">
                <Workflow className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="text-sm font-medium text-zinc-300">{component}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Key Implementation Details</h2>
        <div className="space-y-3 text-zinc-300">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Each service operates as an independent consumer group, ensuring exactly-once processing semantics</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Failed messages remain in PEL (Pending Entries List) for retry or manual intervention</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Redis Streams provides built-in message ID ordering and consumer group acknowledgment tracking</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Horizontal scaling achieved through multiple consumers per service with automatic load balancing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
