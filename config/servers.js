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
  },

  ssl: {
    protocol:  'http',
    transport: 'tls',
    address:   '*',
    ports:     [443],
    key:       'metarhia.key',
    cert:      'metarhia.cer'
  },

  /*rpc: {
    protocol:  'jstp',
    transport: 'tcp',
    address:   '*',
    ports:     [3000],
    heartbeat: '2s'
  },*/

  /*webRpc: {
    protocol:  'jstp',
    transport: 'ws',
    address:   '*',
    ports:     [8000],
    slowTime:  '1s'
  }*/

}
