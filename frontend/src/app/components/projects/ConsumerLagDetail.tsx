import { Project } from '../../data/projectsData';
import { TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  project: Project;
}

export function ConsumerLagDetail({ project }: Props) {
  const { data } = project;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-yellow-500/30 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg">
            <TrendingDown className="h-8 w-8 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">{project.title}</h1>
            <p className="text-zinc-300 text-lg">{project.description}</p>
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Normal Load */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-green-400">Normal Load</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4">
              <div className="text-sm text-zinc-400 mb-1">Consumer Lag</div>
              <div className="text-2xl font-bold text-green-400">{data.testScenarios.normalLoad.lag}</div>
            </div>
            <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4">
              <div className="text-sm text-zinc-400 mb-1">PEL Size</div>
              <div className="text-2xl font-bold text-green-400">{data.testScenarios.normalLoad.pelSize}</div>
            </div>
          </div>
        </div>

        {/* Burst Load */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-500 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-red-400">Burst Load</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-red-500/20 rounded-lg p-4">
              <div className="text-sm text-zinc-400 mb-1">Consumer Lag</div>
              <div className="text-2xl font-bold text-red-400">{data.testScenarios.burstLoad.lag}</div>
            </div>
            <div className="bg-zinc-900/50 border border-red-500/20 rounded-lg p-4">
              <div className="text-sm text-zinc-400 mb-1">PEL Size</div>
              <div className="text-2xl font-bold text-red-400">{data.testScenarios.burstLoad.pelSize}</div>
            </div>
          </div>
        </div>

        {/* Recovery */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 p-2 rounded-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-blue-400">Recovery</h2>
          </div>
          <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-8 text-center">
            <div className="text-sm text-zinc-400 mb-2">Recovery Time</div>
            <div className="text-4xl font-bold text-blue-400">{data.testScenarios.recoveryTime}</div>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Analysis</h2>
        <div className="space-y-4 text-zinc-300">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-500 mb-2">Key Findings</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Under normal load conditions, consumer lag remains minimal (&lt;100ms) with stable PEL size</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Burst traffic causes significant lag increase (2.5s) and PEL growth (5,000 entries)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>System recovers to normal state within 45 seconds after burst subsides</span>
              </li>
            </ul>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
            <h3 className="font-semibold text-zinc-100 mb-2">Recommendations</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Implement auto-scaling for consumer groups based on PEL size thresholds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Set up monitoring alerts for lag exceeding 1 second or PEL size &gt; 1,000</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Consider stream partitioning for workloads with frequent bursts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>Implement exponential backoff for XACK operations during high load</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mitigation Strategies */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Proactive Measures</h3>
          <div className="space-y-3">
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 text-sm text-zinc-300">
              Over-provision consumer capacity by 50%
            </div>
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 text-sm text-zinc-300">
              Implement rate limiting at producer level
            </div>
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 text-sm text-zinc-300">
              Use MAXLEN to cap stream size
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Reactive Measures</h3>
          <div className="space-y-3">
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 text-sm text-zinc-300">
              Automated horizontal scaling triggers
            </div>
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 text-sm text-zinc-300">
              PEL cleanup jobs for stale entries
            </div>
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-3 text-sm text-zinc-300">
              Circuit breaker pattern for degraded consumers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
