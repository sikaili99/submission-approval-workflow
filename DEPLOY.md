# Deploy to a VPS (Ubuntu/Debian, IP-only HTTP)

This brings up the full stack (database + backend + frontend) on a fresh
Ubuntu/Debian VPS using Docker Compose, reachable at the server's public IP.
HTTPS/domain can be layered on later (see the end).

Run every command **on the VPS** over your own SSH session.

---

## 1. Install Docker (skip if already installed)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version && docker compose version
```

## 2. Get the code

```bash
git clone <YOUR_REPO_URL> app
cd app
```

## 3. Configure environment for this server

Find the server's public IP:

```bash
curl -s ifconfig.me; echo
```

Create the root `.env` (Compose reads it automatically). **Replace `SERVER_IP`**
with the value above, and paste your real Cloudinary keys:

```bash
SERVER_IP=$(curl -s ifconfig.me)

cat > .env <<EOF
# --- Postgres ---
POSTGRES_USER=app
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=approvals

# --- URLs (must be the public IP so the browser can reach the API) ---
CORS_ORIGIN=http://${SERVER_IP}:8080
VITE_API_URL=http://${SERVER_IP}:4000

# --- Uploads (Cloudinary free tier) ---
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

MAX_UPLOAD_BYTES=5242880
EOF
```

> `VITE_API_URL` is baked into the frontend at **build time**, so the frontend
> image must be built on the VPS with this value set (step 4 does that).

## 4. Build and start

```bash
docker compose up --build -d
```

The backend waits for Postgres, runs migrations, seeds the two demo users, then
starts. The frontend is built with the IP baked in and served by nginx.

## 5. Open the firewall (if enabled)

```bash
sudo ufw allow 8080/tcp   # frontend
sudo ufw allow 4000/tcp   # backend API
```

Most cloud providers also have a **security group / cloud firewall** — open
inbound TCP **8080** and **4000** there too.

## 6. Verify

```bash
curl -s http://localhost:4000/healthz            # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080   # 200
```

Then from your laptop browser:

- **App:** `http://SERVER_IP:8080`
- Log in with **Continue as Applicant** / **Continue as Reviewer**
  (tokens `demo-applicant-token` / `demo-reviewer-token`).

Put `http://SERVER_IP:8080` (and the seeded logins) in the README's live-demo line.

---

## Operating it

```bash
docker compose ps              # status
docker compose logs -f backend # logs
docker compose down            # stop (keeps the db volume)
docker compose up --build -d   # update after a `git pull`
docker compose down -v         # stop AND wipe the database
```

## Later: domain + HTTPS

When you have a domain pointed at the IP, put an nginx (or Caddy) reverse proxy
in front, terminate TLS with Let's Encrypt, and change `.env` to:

```
CORS_ORIGIN=https://yourdomain
VITE_API_URL=https://api.yourdomain   # or a /api path proxied to :4000
```

then `docker compose up --build -d` to rebuild the frontend with the HTTPS URL.

## Security note

These are **demo** credentials (seeded bearer tokens) over plain HTTP — fine for
an assessment demo, not for production. The Cloudinary keys and DB password live
only in the server's `.env` (never committed). Rotate the Cloudinary keys when
you're done evaluating.
```
