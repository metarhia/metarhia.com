{

  check: 'http://127.0.0.1/',

  cloud: 'MetarhiaCloud',
  server: 'S1',
  controller: {
    host: '127.0.0.1',
    port: 250
  },
  instance: 'controller',

  key: '19nm58993eJ747845fk78A2z7854W90D',
  cookie: 'node',

  firewall: {
    enabled: false,
    limits: {
      ip:   20,
      sid:  10,
      host: 100,
      url:  50,
      app:  200,
      srv:  500
    }
  },

  health: '5m',
  nagle: false,
  gc: 0,
  watch: '2s',

  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  length: 64

}
