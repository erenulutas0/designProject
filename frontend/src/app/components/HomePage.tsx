import { Link } from 'react-router-dom';
import { projectsData } from '../data/projectsData';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';

export function HomePage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'planned':
        return <Calendar className="h-5 w-5 text-zinc-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'planned':
        return 'Planned';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in-progress':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'planned':
        return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/20';
      default:
        return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-yellow-500 mb-4">Research Projects</h2>
        <p className="text-xl text-zinc-300">
          Exploring Redis persistence mechanisms, performance characteristics, and architectural patterns
        </p>
        <div className="mt-6 p-4 bg-zinc-800/50 border border-yellow-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-500 mb-2">Future Work Includes:</h3>
          <ul className="list-disc list-inside text-zinc-300 space-y-1">
            <li>Evaluating Hybrid Persistence Mode (AOF + RDB preamble)</li>
            <li>Measuring the latency impact of AOF rewrite under sustained load</li>
            <li>Comparing Cluster vs Sentinel failover times and consistency gaps</li>
            <li>Implementing a full event-driven microservice pipeline using Redis Streams</li>
            <li>Analyzing consumer lag and PEL size growth under bursty workloads</li>
            <li>Benchmarking p99 tail latency differences between SQL, Redis, and Redis Cluster</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projectsData.map((project, index) => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            className="group relative bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-lg p-6 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-4 right-4">
              {getStatusIcon(project.status)}
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-mono text-yellow-500 mb-2">Project {index + 1}</div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-2 pr-8 group-hover:text-yellow-500 transition-colors">
                {project.title}
              </h3>
            </div>

            <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
              {project.description}
            </p>

            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)}
                {getStatusText(project.status)}
              </span>
              <span className="text-yellow-500 text-sm font-medium group-hover:translate-x-1 transition-transform">
                View Details →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
