# Generate certificates

- Let's Encrypt is a free certificate authority: https://letsencrypt.org/
- Use Certbot (free tool for automatically using Let’s Encrypt certificates on
  manually-administrated websites to enable HTTPS): https://certbot.eff.org/
- Imstall certbot: `dnf -y install certbot`
- Run server: `nohup node server.js &`
- Generete certificates

```
certbot certonly --webroot -w ~/metarhia.com/application/static -d www.metarhia.com -d metarhia.com -m timur.shemsedinov@gmail.com --agree-tos --no-eff-email
yes | cp /etc/letsencrypt/live/metarhia.com/fullchain.pem ~/metarhia.com/application/cert/cert.pem
yes | cp /etc/letsencrypt/live/metarhia.com/privkey.pem ~/metarhia.com/application/cert/key.pem
```
