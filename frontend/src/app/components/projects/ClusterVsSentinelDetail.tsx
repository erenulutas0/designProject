import { Project } from '../../data/projectsData';
import { GitCompare, Shield, Play, AlertCircle, RefreshCw, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Props {
  project: Project;
}

interface FailoverResult {
  timeMs: number;
  oldMaster: string;
  newMaster: string;
  success: boolean;
}

export function ClusterVsSentinelDetail({ project }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failoverResult, setFailoverResult] = useState<FailoverResult | null>(null);
  const [testHistory, setTestHistory] = useState<FailoverResult[]>([]);

  const testFailover = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/benchmark/failover', {
        method: 'POST',
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failover test failed');
      }

      setFailoverResult(result);
      setTestHistory(prev => [result, ...prev].slice(0, 5)); // Keep last 5 tests
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avgFailoverTime = testHistory.length > 0
    ? (testHistory.reduce((sum, t) => sum + t.timeMs, 0) / testHistory.length / 1000).toFixed(2)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg">
            <GitCompare className="h-8 w-8 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
            <p className="text-zinc-300 text-lg">{project.description}</p>
          </div>
          <button
            onClick={testFailover}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${loading
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 hover:scale-105'
              }`}
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {loading ? 'Testing Failover...' : 'Test Sentinel Failover'}
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* No Test State */}
      {!failoverResult && !loading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-500/20 p-4 rounded-full">
              <Shield className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Ready to Test Failover</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-4">
            Click "Test Sentinel Failover" to crash the Redis master and measure how long it takes for Sentinel to promote a replica.
          </p>
          <div className="text-sm text-zinc-500">
            ⚠️ This will temporarily crash the Redis master. It will auto-restart.
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-purple-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Testing Failover...</h3>
          <p className="text-zinc-400">Crashing master and waiting for Sentinel to detect and promote a new master</p>
        </div>
      )}

      {/* Failover Result */}
      {failoverResult && !loading && (
        <>
          {/* Success Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-500 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-400">Failover Successful!</h2>
                <p className="text-zinc-400">Sentinel detected the failure and promoted a new master</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Failover Time */}
              <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-6 text-center">
                <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-sm text-zinc-400 mb-1">Failover Time</div>
                <div className="text-4xl font-bold text-green-400">
                  {(failoverResult.timeMs / 1000).toFixed(2)}s
                </div>
                <div className="text-xs text-zinc-500 mt-1">{failoverResult.timeMs.toFixed(0)}ms</div>
              </div>

              {/* Master Transition */}
              <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-6 md:col-span-2">
                <div className="text-sm text-zinc-400 mb-3">Master Transition</div>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-red-400 mb-1">Old Master</div>
                    <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-mono text-sm">
                      {failoverResult.oldMaster}
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-yellow-500" />
                  <div className="text-center">
                    <div className="text-xs text-green-400 mb-1">New Master</div>
                    <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg font-mono text-sm">
                      {failoverResult.newMaster}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test History */}
          {testHistory.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-zinc-100">Test History</h2>
                {avgFailoverTime && (
                  <div className="text-sm text-zinc-400">
                    Average: <span className="text-purple-400 font-semibold">{avgFailoverTime}s</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {testHistory.map((test, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-zinc-300">Test #{testHistory.length - i}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-zinc-400">
                        {test.oldMaster} → {test.newMaster}
                      </div>
                      <div className="text-lg font-semibold text-purple-400">
                        {(test.timeMs / 1000).toFixed(2)}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Key Insights</h2>
            <div className="space-y-3 text-zinc-300">
              <p>• Sentinel detected master failure and promoted a replica in <span className="text-purple-400 font-semibold">{(failoverResult.timeMs / 1000).toFixed(2)}s</span></p>
              <p>• The new master is now at <span className="text-green-400 font-semibold">{failoverResult.newMaster}</span></p>
              <p className="text-zinc-400 mt-4">
                Redis Sentinel provides automatic failover for Redis master-replica setups.
                The typical failover time depends on the sentinel down-after-milliseconds and failover-timeout settings.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
