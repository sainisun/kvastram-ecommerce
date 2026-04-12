# Hostinger VPS Deployment

This runbook deploys the full Kvastram stack on one Ubuntu VPS:

- `storefront` on `yourdomain.com`
- `admin` on `admin.yourdomain.com`
- `backend` on `api.yourdomain.com`
- `postgres` inside Docker

## Recommended VPS Size

Use a VPS with at least:

- 4 vCPU
- 8 GB RAM
- 160 GB SSD

This gives enough headroom for two Next.js apps, the API, PostgreSQL, image uploads, and build spikes.

## 1. Prepare DNS

Point these A records to your VPS public IP:

- `@`
- `www`
- `admin`
- `api`

## 2. Install Server Dependencies

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and log back in once after adding your user to the `docker` group.

## 3. Clone And Configure

```bash
git clone <your-repo-url> kvastram-platform
cd kvastram-platform

cp .env.hostinger.example .env.hostinger
cp backend/.env.production.example backend/.env.production
cp storefront/.env.production.example storefront/.env.production
cp admin/.env.production.example admin/.env.production
```

Fill the files with your real production values.

Important values:

- `.env.hostinger`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- `backend/.env.production`
  - `DATABASE_URL=postgresql://POSTGRES_USER:POSTGRES_PASSWORD@postgres:5432/POSTGRES_DB`
  - `NODE_ENV=production`
  - `PORT=4000`
  - `JWT_SECRET`
  - `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com`
  - `STOREFRONT_URL=https://yourdomain.com`
  - `ADMIN_URL=https://admin.yourdomain.com`
  - Stripe, SMTP, OAuth keys
- `storefront/.env.production`
  - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
  - `INTERNAL_API_URL=http://backend:4000`
  - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
  - `NEXT_PUBLIC_STORE_URL=https://yourdomain.com`
- `admin/.env.production`
  - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
  - `BACKEND_URL=http://backend:4000`
  - `NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com`

## 4. Start The Stack

```bash
chmod +x deploy/hostinger/deploy.sh
./deploy/hostinger/deploy.sh
```

Or use the VPS bootstrap script directly on the server:

```bash
curl -sSL https://raw.githubusercontent.com/sainisun/kvastram-ecommerce/main/deploy/hostinger/vps-setup.sh | bash
```

That bootstrap script writes Stripe placeholder keys so the backend can boot. Replace those placeholders before taking real payments.

Check containers:

```bash
docker compose -f deploy/hostinger/docker-compose.yml ps
docker compose -f deploy/hostinger/docker-compose.yml logs -f backend
```

## 5. Configure Nginx On The Host

Copy the template and replace placeholder domains:

```bash
sudo cp deploy/hostinger/nginx/kvastram.conf /etc/nginx/sites-available/kvastram.conf
sudo nano /etc/nginx/sites-available/kvastram.conf
sudo ln -s /etc/nginx/sites-available/kvastram.conf /etc/nginx/sites-enabled/kvastram.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Enable HTTPS

Run Certbot after DNS is live:

```bash
sudo certbot --nginx \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d admin.yourdomain.com \
  -d api.yourdomain.com
```

Because the app uses secure cookies in production, do not skip HTTPS.

## 7. Useful Operations

Rebuild after code changes:

```bash
docker compose -f deploy/hostinger/docker-compose.yml up -d --build
```

Stop stack:

```bash
docker compose -f deploy/hostinger/docker-compose.yml down
```

View logs:

```bash
docker compose -f deploy/hostinger/docker-compose.yml logs -f storefront
docker compose -f deploy/hostinger/docker-compose.yml logs -f admin
docker compose -f deploy/hostinger/docker-compose.yml logs -f backend
docker compose -f deploy/hostinger/docker-compose.yml logs -f postgres
```

## 8. Post-Deploy Checklist

- `https://api.yourdomain.com/health` returns healthy
- Storefront home page loads
- Admin login works
- Customer login works
- Wholesale set-password email links open the storefront domain
- Checkout and Stripe webhook config are verified
- SMTP mails send correctly
- Backups exist for PostgreSQL and uploads

## 9. Must-Do Security Work

- Rotate any secrets that were ever committed
- Keep `.env.production` files out of git
- Enable Hostinger firewall or UFW for ports `22`, `80`, `443`
- Back up the `postgres_data` and `backend_uploads` volumes
