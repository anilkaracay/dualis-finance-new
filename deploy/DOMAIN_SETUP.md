# Domain & SSL Setup — Dualis Finance

## 1. Domain Structure

```
dualis.finance              → Vercel (landing page)
app.dualis.finance          → Vercel (main application)
api.dualis.finance          → Railway (backend API)
staging.dualis.finance      → Vercel preview (staging)
api-staging.dualis.finance  → Railway staging
```

## 2. Cloudflare DNS Setup (Free Tier)

### Initial Setup
1. Create a Cloudflare account at https://cloudflare.com
2. Add `dualis.finance` domain
3. Cloudflare will provide 2 nameservers (e.g., `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
4. Update nameservers at your domain registrar (e.g., Namecheap, GoDaddy)
5. Wait for DNS propagation (can take up to 24h, usually minutes)

### DNS Records

| Type  | Name                  | Content                          | Proxy |
|-------|-----------------------|----------------------------------|-------|
| CNAME | `dualis.finance`      | `cname.vercel-dns.com`           | DNS only |
| CNAME | `app`                 | `cname.vercel-dns.com`           | DNS only |
| CNAME | `api`                 | `<railway-hostname>.up.railway.app` | DNS only |
| CNAME | `staging`             | `cname.vercel-dns.com`           | DNS only |
| CNAME | `api-staging`         | `<railway-staging-hostname>.up.railway.app` | DNS only |

> **Note:** Use "DNS only" (grey cloud) for CNAME records pointing to Vercel/Railway — they handle their own SSL. If you want Cloudflare's DDoS protection, use "Proxied" (orange cloud) and set SSL mode to "Full (strict)".

### SSL Configuration
- Go to SSL/TLS → Overview
- Set encryption mode to **Full (strict)**
- Enable "Always Use HTTPS" under SSL/TLS → Edge Certificates
- Enable HSTS (already configured in Next.js headers)

## 3. Vercel Domain Setup

```bash
# Install Vercel CLI if not already installed
npm i -g vercel@latest

# Add domains
vercel domains add dualis.finance
vercel domains add app.dualis.finance

# Verify ownership (follow prompts)
vercel domains verify dualis.finance
```

Vercel will show the CNAME target — update Cloudflare DNS records accordingly.

## 4. Railway Domain Setup

1. Open Railway Dashboard → Select project → Select API service
2. Go to Settings → Networking → Custom Domain
3. Add `api.dualis.finance`
4. Railway will show a CNAME target (e.g., `xxx.up.railway.app`)
5. Add this as a CNAME record in Cloudflare
6. Railway will auto-provision SSL

Repeat for staging: `api-staging.dualis.finance`

## 5. SSL Certificates

All platforms provide **automatic, free SSL**:
- **Cloudflare:** Universal SSL (auto-renewed)
- **Vercel:** Let's Encrypt (auto-renewed)
- **Railway:** Let's Encrypt (auto-renewed)

HSTS header is configured in `next.config.js`:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

## 6. Verification Checklist

After setup, verify:
- [ ] `https://dualis.finance` loads landing page
- [ ] `https://app.dualis.finance` loads dashboard
- [ ] `https://api.dualis.finance/health` returns 200
- [ ] `https://api-staging.dualis.finance/health` returns 200
- [ ] All URLs redirect HTTP → HTTPS
- [ ] SSL certificates are valid (check with `curl -vI`)
