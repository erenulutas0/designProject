import { Project } from '../../data/projectsData';
import { Activity, AlertTriangle, TrendingUp, Play, RefreshCw, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useState } from 'react';

interface Props {
  project: Project;
}

interface TestResult {
  maxLatency: number;
  avgLatency: number;
  samples: number;
}

export function AofRewriteLatencyDetail({ project }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/benchmark/aof-rewrite', {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Test failed');
      }
      const result = await res.json();
      setTestResult(result);
      setTestHistory(prev => [result, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create chart data from test history
  const chartData = testHistory.map((t, i) => ({
    test: `Test ${testHistory.length - i}`,
    avgLatency: t.avgLatency,
    maxLatency: t.maxLatency,
    samples: t.samples
  })).reverse();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg">
            <Activity className="h-8 w-8 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
            <p className="text-zinc-300 text-lg">{project.description}</p>
          </div>
          <button
            onClick={runTest}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${loading
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 hover:scale-105'
              }`}
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {loading ? 'Running Rewrite...' : 'Test AOF Rewrite'}
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
      {!testResult && !loading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <Activity className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Ready to Test AOF Rewrite</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Click "Test AOF Rewrite" to trigger a BGREWRITEAOF and measure latency impact during the rewrite process.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-semibold text-zinc-100 mb-2">Running AOF Rewrite...</h3>
          <p className="text-zinc-400">Measuring write latency during BGREWRITEAOF operation</p>
        </div>
      )}

      {/* Test Results */}
      {testResult && !loading && (
        <>
          {/* Metrics Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Average Latency */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-green-400">Average Latency</h2>
              </div>
              <div className="text-4xl font-bold text-green-400">
                {testResult.avgLatency.toFixed(2)}ms
              </div>
              <div className="text-sm text-zinc-400 mt-2">During rewrite operation</div>
            </div>

            {/* Max Latency */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500 p-2 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-red-400">Max Latency</h2>
              </div>
              <div className="text-4xl font-bold text-red-400">
                {testResult.maxLatency.toFixed(2)}ms
              </div>
              <div className="text-sm text-zinc-400 mt-2">Peak latency spike</div>
            </div>

            {/* Samples */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-blue-400">Samples</h2>
              </div>
              <div className="text-4xl font-bold text-blue-400">
                {testResult.samples}
              </div>
              <div className="text-sm text-zinc-400 mt-2">Measurements taken</div>
            </div>
          </div>

          {/* Impact Analysis */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-500 mb-2">AOF Rewrite Impact Analysis</h3>
                <p className="text-zinc-300">
                  During the rewrite operation, write latency increased from baseline.
                  The maximum latency spike was <span className="text-red-400 font-semibold">{testResult.maxLatency.toFixed(2)}ms</span>
                  {testResult.maxLatency > testResult.avgLatency * 2 && (
                    <span className="text-yellow-400"> ({((testResult.maxLatency / testResult.avgLatency - 1) * 100).toFixed(0)}% above average)</span>
                  )}.
                </p>
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          {chartData.length > 1 && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-zinc-100">Latency Trend (Test History)</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis
                      dataKey="test"
                      stroke="#a1a1aa"
                      tick={{ fill: '#a1a1aa' }}
                    />
                    <YAxis
                      stroke="#a1a1aa"
                      tick={{ fill: '#a1a1aa' }}
                      label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#eab308' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '0.5rem',
                        color: '#fafafa'
                      }}
                    />
                    <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Target', fill: '#22c55e' }} />
                    <Line
                      type="monotone"
                      dataKey="avgLatency"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Avg Latency"
                      dot={{ fill: '#22c55e' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxLatency"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Max Latency"
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Key Insights */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Key Insights</h2>
            <div className="space-y-3 text-zinc-300">
              <p>• Average write latency during rewrite: <span className="text-green-400 font-semibold">{testResult.avgLatency.toFixed(2)}ms</span></p>
              <p>• Maximum latency spike: <span className="text-red-400 font-semibold">{testResult.maxLatency.toFixed(2)}ms</span></p>
              <p>• Total samples collected: <span className="text-blue-400 font-semibold">{testResult.samples}</span></p>
              <p className="text-zinc-400 mt-4">
                AOF rewrite is a background operation that compacts the append-only file.
                While Redis continues to handle writes, you may observe temporary latency increases
                due to I/O contention.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
