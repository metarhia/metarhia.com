# Metarhia technology stack web site

## Links

- [Impress Application Server](https://github.com/metarhia/impress)
- [Metarhia Server Application Example](https://github.com/metarhia/Example)
- [Documentation and Specifications](https://github.com/metarhia/Contracts)

## Install

- Use Fedora Linux Server 42
- Install Node.js 24 with `nvm` or `dnf`
- Install [certbot](https://github.com/certbot/certbot)
- Generate SSL certificates
- Configure application server: `./application/config`
- Register Metarhia server as a service

Put following file to `/etc/systemd/system/metarhia-com.service`

```js
[Unit]
Description=metarhia.com web app (Node.js)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/root/metarhia.com
ExecStart=node server.js
Restart=always
RestartSec=3
KillSignal=SIGTERM
TimeoutStopSec=20
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Reload services

```sh
sudo systemctl daemon-reload
```

Enable autorun

```sh
sudo systemctl enable metarhia-com.service
```

Start service

```sh
sudo systemctl start metarhia-com.service
```

Now you can get service status

```sh
sudo systemctl status metarhia-com-web.service
```

And view service logs

```sh
journalctl -u metarhia-com-web -f
```

## License

Copyright (c) 2020-2025 Metarhia contributors.
This starter kit is [MIT licensed](./LICENSE).
