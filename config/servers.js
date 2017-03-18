{

  master: {
    protocol:  'jstp',
    transport: 'tcp',
    address:   '127.0.0.1',
    ports:     [250],
    slowTime:  '1s'
  },

  www: {
    protocol:  'http',
    transport: 'tcp',
    address:   '*',
    ports:     [80],
    slowTime:  '1s',
    timeout:   '30s',
    keepAlive: '5s',
    applications: ['metarhia.com']
  },

  rpc: {
    protocol:  'jstp',
    transport: 'tcp',
    address:   '*',
    ports:     [3000, [1]],
    applications: ['example'],
    heartbeat: '2s'
  },

  webRpc: {
    protocol:  'jstp',
    transport: 'ws',
    address:   '*',
    ports:     [8000],
    applications: ['example'],
    slowTime:  '1s'
  }

}
