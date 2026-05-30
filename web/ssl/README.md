# SSL Certificates Directory

Place your manual SSL/TLS certificates in this directory. 

Nginx is configured to look for the following file names:
* **Certificate:** `nginx.crt`
* **Private Key:** `nginx.key`

If you want to generate self-signed certificates for testing/local development, you can run:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx.key \
  -out nginx.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```
