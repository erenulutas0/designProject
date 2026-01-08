export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  data?: any;
}

export const projectsData: Project[] = [
  {
    id: 'p99-latency',
    title: 'P99 Latency & Multi-DB Comparison',
    description: 'Benchmarking latency between SQL, Redis, Redis Cluster, MongoDB, and Memcached',
    status: 'in-progress',
    data: {
      benchmarkResults: {
        postgresql: { p50: 8.2, p90: 15.1, p99: 87.5 },
        redis: { p50: 0.8, p90: 1.0, p99: 2.1 },
        redisCluster: { p50: 1.1, p90: 1.5, p99: 3.5 },
        mongodb: { p50: 4.5, p90: 8.1, p99: 22.3 },
        memcached: { p50: 0.5, p90: 0.8, p99: 1.5 }
      }
    }
  },
  {
    id: 'cluster-vs-sentinel',
    title: 'Cluster vs Sentinel Failover',
    description: 'Real-time failover testing measuring recovery time and data safety',
    status: 'completed',
    data: {}
  },
  {
    id: 'hybrid-persistence',
    title: 'Hybrid Persistence (AOF + RDB)',
    description: 'Live monitoring of AOF/RDB status and triggerable Rewrite operations',
    status: 'completed',
    data: {}
  },
  {
    id: 'aof-rewrite-latency',
    title: 'AOF Rewrite Impact',
    description: 'Measuring latency spikes during background AOF rewrite operations',
    status: 'in-progress',
    data: {}
  },
  {
    id: 'concurrent-connections',
    title: 'Concurrent Connections & Thread Safety',
    description: 'Benchmarks Redis vs PostgreSQL under high concurrency (50+ clients)',
    status: 'planned',
    data: {}
  },
  {
    id: 'durability-benchmark',
    title: 'Write Durability & Data Safety',
    description: 'Comparing data safety risks between AOF fsync, WAL, and Journaling',
    status: 'planned',
    data: {}
  },
  {
    id: 'memory-usage',
    title: 'Memory Usage Analysis',
    description: 'Comparing RAM usage between Redis, PostgreSQL, and MongoDB for same dataset',
    status: 'planned',
    data: {}
  },
  {
    id: 'security-comparison',
    title: 'Security Features Comparison',
    description: 'Analysis of ACLs, Encryption, and Authentication methods across databases',
    status: 'planned',
    data: {}
  },
  {
    id: 'architecture-comparison',
    title: 'Database Architecture Overview',
    description: 'Comprehensive comparison of data models, scalability, and persistence',
    status: 'completed',
    data: {}
  }
];

export function getProjectById(id: string): Project | undefined {
  return projectsData.find(project => project.id === id);
}
