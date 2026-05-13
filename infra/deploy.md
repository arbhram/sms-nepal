# Deployment & Infrastructure Guide

## DigitalOcean Droplet Setup

### 1. DNS Records (add at your registrar / Cloudflare)

| Type  | Name              | Value              | TTL  |
|-------|-------------------|--------------------|------|
| A     | @                 | `<droplet-IP>`     | 3600 |
| A     | *                 | `<droplet-IP>`     | 3600 |
| CNAME | www               | myschoolsaas.com.  | 3600 |

The `*` wildcard A record handles all school subdomains (e.g. `kathmandu-academy.myschoolsaas.com`).

For a custom school domain (e.g. `school.edu.np`), the school's IT admin adds:

| Type  | Name             | Value                           |
|-------|------------------|---------------------------------|
| CNAME | school.edu.np    | kathmandu-academy.myschoolsaas.com |

---

### 2. Wildcard TLS Certificate (Let's Encrypt + Certbot via Cloudflare DNS-01)

```bash
# Install Certbot + Cloudflare plugin
sudo apt install certbot python3-certbot-nginx
sudo pip install certbot-dns-cloudflare

# Create Cloudflare API token (Cloudflare dashboard → API Tokens → Edit zone DNS)
mkdir -p ~/.secrets/certbot
cat > ~/.secrets/certbot/cloudflare.ini << 'EOF'
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
EOF
chmod 600 ~/.secrets/certbot/cloudflare.ini

# Issue wildcard cert
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini \
  -d myschoolsaas.com \
  -d *.myschoolsaas.com \
  --preferred-challenges dns-01

# Auto-renew (runs twice daily via systemd timer installed by certbot)
sudo certbot renew --dry-run
```

For individual custom school domains, issue a separate cert per domain:
```bash
sudo certbot certonly --nginx -d school.edu.np
```

---

### 3. Nginx

```bash
# Copy config
sudo cp infra/nginx.conf /etc/nginx/sites-available/sms-nepal
sudo ln -sf /etc/nginx/sites-available/sms-nepal /etc/nginx/sites-enabled/sms-nepal
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

### 4. Environment Variables (production `.env`)

```env
PORT=3001
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<64-char random string>
JWT_EXPIRE=30d
ROOT_DOMAIN=myschoolsaas.com
SUPER_ADMIN_JWT_SECRET=<different 64-char random string>
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 5. Build & Deploy Frontend

```bash
cd frontend
npm run build               # outputs to frontend/dist/
sudo mkdir -p /var/www/sms-nepal
sudo cp -r dist /var/www/sms-nepal/dist
```

---

### 6. Start Backend with PM2

```bash
npm install -g pm2
cd backend
pm2 start server.js --name sms-nepal-api --interpreter node
pm2 save
pm2 startup   # follow the printed command to enable on reboot
```

---

### 7. Create First Super Admin

```bash
cd backend
SUPER_ADMIN_EMAIL=yourname@company.com \
SUPER_ADMIN_PASSWORD=changeme123 \
node scripts/createSuperAdmin.js
```

Change the password immediately after first login at `https://admin.myschoolsaas.com/superadmin/login`.

---

## Local Development

### Option A — X-Dev-Tenant header (easiest, no /etc/hosts)

The `tenantResolver` middleware checks for `X-Dev-Tenant` in development mode and
resolves the school from that header instead of the hostname. Your browser won't send
this header, but you can set it in the Vite dev proxy:

In `frontend/vite.config.js`, temporarily add to the proxy entry:
```js
headers: { 'X-Dev-Tenant': 'myschool' }
```

### Option B — /etc/hosts subdomain

```bash
# Add to /etc/hosts
127.0.0.1   myschool.localhost
127.0.0.1   admin.localhost
```

Then access the app at `http://myschool.localhost:5173`.  
Vite is configured with `changeOrigin: false` so the subdomain Host header is forwarded to Node.

---

## Phased Rollout Plan

### Phase 1 — Foundation (done)
- [x] Mongoose tenant plugin with AsyncLocalStorage
- [x] Compound unique indexes on all models
- [x] `tenantResolver` middleware (subdomain + custom domain)
- [x] `authMiddleware` schoolId cross-check
- [x] SuperAdmin model + routes + controller
- [x] School public API (`/api/school/current`)
- [x] Frontend `SchoolContext` (branding from subdomain)
- [x] Super admin console (login + school list + suspend/activate)

### Phase 2 — Onboarding flow
- [ ] School signup form (apex domain → creates School + admin user)
- [ ] Trial expiry email reminders (cron job)
- [ ] Stripe / eSewa payment integration for plan upgrades

### Phase 3 — Custom domains
- [ ] Custom domain request UI in school Settings page
- [ ] DNS verification webhook or polling job
- [ ] Certbot automation for per-domain certs (or use Cloudflare Tunnel)

### Phase 4 — Hardening
- [ ] Rate limiting per-school (not just per-IP)
- [ ] Audit log model + middleware
- [ ] $lookup sub-pipeline tenant scoping (currently a known gap)
- [ ] Automated tenant isolation test in CI

---

## Testing Checklist

### Tenant Isolation
- [ ] School A user cannot access School B data (returns 401/403 or 0 results)
- [ ] Login at `school-b.myschoolsaas.com` with School A token → 401
- [ ] Missing schoolId in JWT → 401 "Please log in again"
- [ ] `node backend/scripts/testTenantIsolation.js` passes all 10 tests

### Subdomain Routing
- [ ] `myschool.localhost:5173` resolves to correct school
- [ ] `unknown-school.localhost:5173` → 404
- [ ] `admin.localhost:5173` shows super admin login (no school context)
- [ ] `localhost:5173` (bare) shows login page (no school, `school` in context is null)

### Custom Domains
- [ ] Setting a custom domain returns DNS instructions
- [ ] Unverified custom domain → 404 from tenantResolver
- [ ] Verified custom domain resolves school correctly
- [ ] Changing custom domain resets `customDomainVerified` to false

### Super Admin
- [ ] Login with wrong credentials → 401
- [ ] School token cannot be used on `/api/superadmin/*` → 401
- [ ] Super admin token cannot be used on tenant routes → 401
- [ ] Suspend school → active users get 403 on next request
- [ ] Activate school → access restored

### SSL / Nginx
- [ ] HTTP → HTTPS redirect works for apex and subdomains
- [ ] `curl -I https://myschoolsaas.com` shows correct cert
- [ ] `curl -I https://school.myschoolsaas.com` shows wildcard cert covering `*.myschoolsaas.com`
- [ ] Certbot auto-renew dry run succeeds
