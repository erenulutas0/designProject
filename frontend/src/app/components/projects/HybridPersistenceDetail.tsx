import { Project } from '../../data/projectsData';
import { Database, FileText, Activity, AlertCircle, RefreshCw, Play, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  project: Project;
}

interface PersistenceStatus {
  aofEnabled: boolean;
  aofRewriteInProgress: boolean;
  aofCurrentSize: number;
  aofBaseSize: number;
  rdbBgsaveInProgress: boolean;
  rdbLastSaveTime: number;
  aofLastRewriteTimeMs: number;
}

export function HybridPersistenceDetail({ project }: Props) {
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PersistenceStatus | null>(null);
  const [rewriteResult, setRewriteResult] = useState<any>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/hybrid-persistence/status');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch status');
      }
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerRewrite = async () => {
    setRewriting(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/hybrid-persistence/rewrite', {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Rewrite failed');
      }
      const result = await res.json();
      setRewriteResult(result);
      // Refresh status after rewrite
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRewriting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const formatBytes = (bytes: any) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg">
            <Database className="h-8 w-8 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
            <p className="text-zinc-300 text-lg">{project.description}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${loading
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-600 hover:bg-zinc-500 text-white'
                }`}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={triggerRewrite}
              disabled={rewriting}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${rewriting
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 hover:scale-105'
                }`}
            >
              {rewriting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {rewriting ? 'Rewriting...' : 'Trigger AOF Rewrite'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && !status && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-100">Loading Status...</h3>
        </div>
      )}

      {/* Status Display */}
      {status && (
        <>
          {/* Status Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-zinc-100">Status</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">AOF Enabled:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.aofEnabled
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                    {status.aofEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Rewrite In Progress:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.aofRewriteInProgress
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'bg-zinc-700 text-zinc-300'
                    }`}>
                    {status.aofRewriteInProgress ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">RDB Bgsave In Progress:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.rdbBgsaveInProgress
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'bg-zinc-700 text-zinc-300'
                    }`}>
                    {status.rdbBgsaveInProgress ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-zinc-100">Persistence Metrics</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">AOF Current Size:</span>
                  <span className="text-yellow-500 font-mono text-sm">{formatBytes(status.aofCurrentSize)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">AOF Base Size:</span>
                  <span className="text-yellow-500 font-mono text-sm">{formatBytes(status.aofBaseSize)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Last RDB Save:</span>
                  <span className="text-yellow-500 font-mono text-sm">{formatTime(status.rdbLastSaveTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rewrite Result */}
          {rewriteResult && (
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold text-green-400">{rewriteResult.message}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">New AOF Size</div>
                  <div className="text-2xl font-bold text-green-400">{formatBytes(rewriteResult.aofCurrentSize)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">Base Size</div>
                  <div className="text-2xl font-bold text-green-400">{formatBytes(rewriteResult.aofBaseSize)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Key Insights</h2>
            <div className="space-y-3 text-zinc-300">
              <p>• AOF (Append Only File) is <span className={status.aofEnabled ? 'text-green-400' : 'text-red-400'}>{status.aofEnabled ? 'enabled' : 'disabled'}</span></p>
              <p>• Current AOF file size: <span className="text-yellow-400 font-semibold">{formatBytes(status.aofCurrentSize)}</span></p>
              <p className="text-zinc-400 mt-4">
                Hybrid persistence combines AOF durability with RDB snapshot speed.
                Click "Trigger AOF Rewrite" to compact the AOF file and enable hybrid mode with RDB preamble.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Not Connected State */}
      {!loading && !status && !error && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <Database className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Ready to Fetch Status</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Click "Refresh" to fetch the current persistence status from Redis.
          </p>
        </div>
      )}
    </div>
  );
}
