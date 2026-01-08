# Redis Project Setup Instructions

I have configured the backend and Docker environments for the specified research topics (Benchmarking, Cluster vs Sentinel, AOF Rewrite).

## 1. Prerequisites
- Docker Desktop must be running.
- Node.js installed.

## 2. Start Infrastructure (Docker)
You need to start the containers for the specific tests you want to run.

### Benchmarking (SQL vs Redis vs Cluster)
```powershell
cd benchmarking
docker-compose up -d
```

### Cluster vs Sentinel
```powershell
cd cluster
docker-compose up -d
cd ../sentinel
docker-compose up -d
```

### AOF Rewrite
```powershell
cd aof-rewrite
docker-compose up -d
```

## 3. Start the Backend API
The backend orchestrates the tests and provides data to the frontend.
```powershell
cd backend
npm install
npm start
```
The server will run on `http://localhost:3001`.

## 4. Run Frontend
(Assumed already running or start as usual)
```powershell
cd frontend
npm run dev
```

## 5. Usage
- Navigate to the project pages in the frontend.
- You will see new "Run Live Benchmark" or "Test Failover" buttons.
- Click them to execute the real tests against the Docker containers and see the results!
