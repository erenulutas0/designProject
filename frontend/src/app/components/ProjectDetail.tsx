import { useParams } from 'react-router-dom';
import { getProjectById } from '../data/projectsData';
import { HybridPersistenceDetail } from './projects/HybridPersistenceDetail';
import { AofRewriteLatencyDetail } from './projects/AofRewriteLatencyDetail';
import { ClusterVsSentinelDetail } from './projects/ClusterVsSentinelDetail';
import { EventDrivenDetail } from './projects/EventDrivenDetail';
import { ConsumerLagDetail } from './projects/ConsumerLagDetail';
import { P99LatencyDetail } from './projects/P99LatencyDetail';
import { ArchitectureComparisonDetail } from './projects/ArchitectureComparisonDetail';
import { SecurityComparisonDetail } from './projects/SecurityComparisonDetail';
import { ConcurrentConnectionsDetail } from './projects/ConcurrentConnectionsDetail';
import { WriteDurabilityDetail } from './projects/WriteDurabilityDetail';
import { MemoryUsageDetail } from './projects/MemoryUsageDetail';
import { Wrench } from 'lucide-react';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const project = id ? getProjectById(id) : undefined;

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-800/50 border border-zinc-700 rounded-lg">
          <Wrench className="h-12 w-12 text-zinc-500 mb-4" />
          <p className="text-xl text-zinc-400">Project not found.</p>
        </div>
      </div>
    );
  }

  const renderProjectContent = () => {
    switch (project.id) {
      case 'hybrid-persistence':
        return <HybridPersistenceDetail project={project} />;
      case 'aof-rewrite-latency':
        return <AofRewriteLatencyDetail project={project} />;
      case 'cluster-vs-sentinel':
        return <ClusterVsSentinelDetail project={project} />;
      case 'event-driven-microservice':
        return <EventDrivenDetail project={project} />;
      case 'consumer-lag':
        return <ConsumerLagDetail project={project} />;
      case 'p99-latency':
        return <P99LatencyDetail project={project} />;
      case 'architecture-comparison':
        return <ArchitectureComparisonDetail project={project} />;
      case 'security-comparison':
        return <SecurityComparisonDetail project={project} />;
      case 'concurrent-connections':
        return <ConcurrentConnectionsDetail project={project} />;
      case 'durability-benchmark':
        return <WriteDurabilityDetail project={project} />;
      case 'memory-usage':
        return <MemoryUsageDetail project={project} />;
      default:
        return (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8">
            <p className="text-zinc-400">Project content is generic...</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {renderProjectContent()}
    </div>
  );
}
