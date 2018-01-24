{
  enabled: true,

  keepDays: 100,
  writeInterval: '3s',
  writeBuffer: 64 * 1024,
  files: [
    'access', 'api', 'error', 'debug', 'slow',
    'server', 'node', 'cloud', 'warning'
  ],
  stdout: [
    'error', 'debug', 'warning'
  ]
}
