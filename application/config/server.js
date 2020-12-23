({
  host: '0.0.0.0',
  balancer: 80,
  protocol: 'https',
  ports: [443],
  timeout: 5000,
  concurrency: 1000,
  queue: {
    size: 2000,
    timeout: 3000,
  },
});
