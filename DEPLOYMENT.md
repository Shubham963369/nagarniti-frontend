# NagarNiti - Deployment Guide

## Server Details

| Item | Value |
|------|-------|
| **Domain** | https://nagarniti.xoidlabs.com |
| **EC2 IP** | 13.127.152.85 |
| **SSH User** | ec2-user |
| **PEM File** | nagarniti.pem (in parent folder) |
| **Frontend Path** | /home/ec2-user/nagarniti-frontend |
| **Backend Path** | /home/ec2-user/nagarniti-backend |
| **Node Version** | v20.20.0 |
| **PM2 Apps** | nagarniti-frontend, nagarniti-backend |
| **SSL** | Let's Encrypt (auto-renewal enabled) |

---

## Architecture

```
        ┌─────────────────────────────────────┐
        │  nagarniti.xoidlabs.com (HTTPS)     │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │
                    │  Port 80/443│
                    │  + SSL/TLS  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │  /api/*   │    │    /*     │    │  Static   │
    │           │    │           │    │  Files    │
    └─────┬─────┘    └─────┬─────┘    └───────────┘
          │                │
          ▼                ▼
    ┌───────────┐    ┌───────────┐
    │  Backend  │    │ Frontend  │
    │ Port 5000 │    │ Port 3000 │
    │  Express  │    │  Next.js  │
    └─────┬─────┘    └───────────┘
          │
          ▼
    ┌───────────┐
    │ Supabase  │
    │ PostgreSQL│
    └───────────┘
```

---

## Quick Commands

### SSH into Server
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85
```

### Check App Status
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 status"
```

### View Logs
```bash
# Frontend logs
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 logs nagarniti-frontend"

# Backend logs
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 logs nagarniti-backend"

# All logs
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 logs"
```

---

## How to Deploy Changes

### Frontend Only
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-frontend && git pull && npm install && npm run build && pm2 restart nagarniti-frontend"
```

### Backend Only
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-backend && git pull && npm install && npm run build && pm2 restart nagarniti-backend"
```

### Both (Full Deploy)
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-backend && git pull && npm install && npm run build && cd /home/ec2-user/nagarniti-frontend && git pull && npm install && npm run build && pm2 restart all"
```

---

## Environment Variables

### Frontend (.env.local)
```bash
# Copy to server
scp -i ../nagarniti.pem .env.local ec2-user@13.127.152.85:/home/ec2-user/nagarniti-frontend/.env.local

# Then rebuild (NEXT_PUBLIC vars are baked at build time)
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-frontend && npm run build && pm2 restart nagarniti-frontend"
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (https://nagarniti.xoidlabs.com) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key |

### Backend (.env)
```bash
# Copy to server
scp -i ../nagarniti.pem .env ec2-user@13.127.152.85:/home/ec2-user/nagarniti-backend/.env

# Restart backend
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 restart nagarniti-backend"
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SESSION_SECRET` | Express session secret |
| `JWT_ACCESS_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `PORT` | Backend port (5000) |
| `FRONTEND_URL` | Frontend URL for CORS (https://nagarniti.xoidlabs.com) |
| `NODE_ENV` | Environment (production) |
| `COOKIE_SECURE` | Set to `true` for HTTPS, `false` for HTTP |

---

## Nginx Configuration

Location: `/etc/nginx/conf.d/nagarniti.conf`

Nginx is configured with SSL via Certbot. The configuration includes:
- HTTP to HTTPS redirect
- SSL certificates from Let's Encrypt
- Reverse proxy to frontend (port 3000) and backend (port 5000)

### Restart Nginx
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "sudo nginx -t && sudo systemctl restart nginx"
```

### View Current Config
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cat /etc/nginx/conf.d/nagarniti.conf"
```

---

## Troubleshooting

### Check if apps are running
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 status"
```

### Restart all apps
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 restart all"
```

### Check Nginx status
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "sudo systemctl status nginx"
```

### View error logs
```bash
# PM2 error logs
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "pm2 logs --err --lines 50"

# Nginx error logs
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "sudo tail -50 /var/log/nginx/error.log"
```

### Test locally on server
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "curl -s localhost:3000 | head -5"
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "curl -s localhost:5000/api/health"
```

---

## AWS Security Group

Ensure these ports are open in EC2 Security Group:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP or 0.0.0.0/0 | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | SSL traffic |

---

## SSL Setup (Let's Encrypt)

SSL is already configured for `nagarniti.xoidlabs.com`.

| Item | Value |
|------|-------|
| **Domain** | nagarniti.xoidlabs.com |
| **Certificate** | /etc/letsencrypt/live/nagarniti.xoidlabs.com/fullchain.pem |
| **Private Key** | /etc/letsencrypt/live/nagarniti.xoidlabs.com/privkey.pem |
| **Expires** | 2026-04-28 |
| **Auto-Renewal** | Enabled (certbot-renew.timer) |

### Check SSL Status
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "sudo certbot certificates"
```

### Manual Renewal (if needed)
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "sudo certbot renew"
```

### Check Auto-Renewal Timer
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "sudo systemctl status certbot-renew.timer"
```

---

## Database

- **Provider:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Migrations:** Run via `npm run db:push` or `npm run db:migrate`

### Run database migrations
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-backend && npm run db:push"
```

### Seed database
```bash
ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-backend && npm run db:seed"
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@nagarniti.gov.in | Admin@123 |
| Ward Admin (Worli) | suresh.patil@bmc.gov.in | Admin@123 |
| Ward Admin (Bandra) | priya.sharma@bmc.gov.in | Admin@123 |
| Ward Admin (Andheri) | rajesh.kumar@bmc.gov.in | Admin@123 |
| Voter | voter1@example.com | Voter@123 |
| Voter | voter2@example.com | Voter@123 |

---

## Quick Reference

### URLs
- **Production:** https://nagarniti.xoidlabs.com
- **API Health:** https://nagarniti.xoidlabs.com/api/health

### One-Command Deploy
```bash
# Backend changes
git push && ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-backend && git pull && npm run build && pm2 restart nagarniti-backend"

# Frontend changes
git push && ssh -i ../nagarniti.pem ec2-user@13.127.152.85 "cd /home/ec2-user/nagarniti-frontend && git pull && npm run build && pm2 restart nagarniti-frontend"
```
