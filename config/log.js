{
  keepDays: 100,
  writeInterval: '3s',
  writeBuffer: 64 * 1024,
  applicationLog: false,
  serverLog: true,
  files: [
    'access', 'api', 'error', 'debug', 'slow',
    'server', 'node', 'cloud', 'warning'
  ],
  stdout: [
    'error', 'debug', 'warning'
  ]
}
