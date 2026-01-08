import { Project } from '../../data/projectsData';
import { Workflow, Zap, CheckCircle2 } from 'lucide-react';

interface Props {
  project: Project;
}

export function EventDrivenDetail({ project }: Props) {
  const { data } = project;

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
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6">Architecture Components</h2>
        <div className="grid md:grid-cols-5 gap-4">
          {data.architecture.components.map((component: string, index: number) => (
            <div 
              key={index}
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

      {/* Stream Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Stream Names</h2>
          <div className="space-y-3">
            {data.architecture.streamNames.map((stream: string, index: number) => (
              <div 
                key={index}
                className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3"
              >
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-zinc-300 font-mono">{stream}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Consumer Groups</h2>
          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-8 text-center">
            <div className="text-6xl font-bold text-yellow-500 mb-2">
              {data.architecture.consumerGroups}
            </div>
            <div className="text-zinc-400">Active Consumer Groups</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle2 className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-zinc-100">Performance Metrics</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(data.performance).map(([key, value]) => (
            <div key={key} className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="text-sm text-zinc-400 mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-3xl font-bold text-yellow-500">{value as string}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Implementation Notes</h2>
        <div className="space-y-3 text-zinc-300">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Producer services publish events to designated Redis Streams with automatic partitioning</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Consumer groups ensure exactly-once delivery semantics with acknowledgment tracking</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Failed messages are automatically routed to Dead Letter Queue for manual inspection</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
            <p>Horizontal scaling achieved through consumer group parallelization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
