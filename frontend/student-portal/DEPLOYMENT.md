# Student Portal Deployment Guide

## Prerequisites

Before deploying the Student Portal, ensure you have:

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. **Backend API** running and accessible
4. **Environment variables** configured
5. **Domain/hosting** setup (for production)

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd frontend/student-portal
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3002

---

## Production Build

### 1. Build the Application

```bash
npm run build
```

This creates an optimized production build in `.next` folder.

### 2. Test Production Build Locally

```bash
npm start
```

### 3. Environment Variables for Production

Create `.env.production.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel --prod
```

#### Step 4: Configure Environment Variables
In Vercel Dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api`

#### Custom Domain
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed

---

### Option 2: Traditional VPS/Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- Nginx or Apache web server
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Upload Files
```bash
# On your server
cd /var/www
git clone <your-repo-url> student-portal
cd student-portal/frontend/student-portal
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment
```bash
nano .env.production.local
```

Add:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

#### Step 4: Build Application
```bash
npm run build
```

#### Step 5: Setup PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "student-portal" -- start

# Enable startup on boot
pm2 startup
pm2 save
```

#### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/student-portal`:

```nginx
server {
    listen 80;
    server_name student.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/student-portal /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Step 7: Setup SSL with Let's Encrypt
```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d student.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

---

### Option 3: Docker Deployment

#### Dockerfile

Create `Dockerfile` in student-portal directory:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

ENV PORT 3002

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  student-portal:
    build: ./frontend/student-portal
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f student-portal

# Stop
docker-compose down
```

---

### Option 4: AWS Deployment

#### Using AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Click "New App" > "Host web app"
   - Connect your Git repository

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend/student-portal
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/student-portal/.next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   - Add `NEXT_PUBLIC_API_URL` in Amplify Console

4. **Deploy**
   - Push to connected branch
   - Automatic deployment on push

---

## Post-Deployment Checklist

### 1. Verify Application
- [ ] Application loads correctly
- [ ] Login functionality works
- [ ] All pages accessible
- [ ] API connections successful
- [ ] Images and assets load

### 2. Test Core Features
- [ ] Student login
- [ ] Dashboard displays correctly
- [ ] Course enrollment works
- [ ] Grades display properly
- [ ] Transcript loads
- [ ] Profile editing works

### 3. Performance Checks
- [ ] Page load times acceptable
- [ ] Images optimized
- [ ] No console errors
- [ ] Mobile responsiveness
- [ ] Browser compatibility

### 4. Security Checks
- [ ] HTTPS enabled
- [ ] Environment variables not exposed
- [ ] CORS configured correctly
- [ ] Rate limiting in place
- [ ] Security headers configured

### 5. Monitoring Setup
- [ ] Error tracking (e.g., Sentry)
- [ ] Analytics (e.g., Google Analytics)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Log aggregation

---

## Environment Variables

### Required Variables

```bash
# API endpoint
NEXT_PUBLIC_API_URL=<backend-api-url>
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_GA_ID=<google-analytics-id>

# Error tracking
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>

# Feature flags
NEXT_PUBLIC_ENABLE_FEATURE_X=true
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free)
```bash
certbot --nginx -d student.yourdomain.com
```

### Commercial SSL
1. Purchase SSL certificate
2. Upload certificate files to server
3. Configure Nginx/Apache with certificate paths

### SSL Best Practices
- Use TLS 1.2+
- Enable HSTS
- Configure strong ciphers
- Regular certificate renewal

---

## Performance Optimization

### 1. Enable Gzip Compression

Nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. Browser Caching

```nginx
location /_next/static/ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN Setup
- Use Cloudflare or similar CDN
- Configure caching rules
- Enable automatic minification

---

## Monitoring & Logging

### Application Logs
```bash
# PM2 logs
pm2 logs student-portal

# Docker logs
docker-compose logs -f
```

### Error Tracking with Sentry

1. Install Sentry:
```bash
npm install @sentry/nextjs
```

2. Configure `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### Uptime Monitoring
- UptimeRobot
- Pingdom
- StatusCake

---

## Backup Strategy

### Application Code
- Git repository (GitHub/GitLab)
- Regular commits
- Tagged releases

### Configuration
- Document environment variables
- Backup Nginx/Apache configs
- SSL certificates backup

---

## Scaling Considerations

### Horizontal Scaling
- Multiple server instances
- Load balancer (Nginx, HAProxy, AWS ALB)
- Session management

### Vertical Scaling
- Increase server resources
- Optimize Node.js memory
- Database connection pooling

### CDN Integration
- Static asset delivery
- Edge caching
- Geographic distribution

---

## Troubleshooting

### Application Won't Start
1. Check Node.js version
2. Verify environment variables
3. Review build logs
4. Check port availability

### API Connection Issues
1. Verify API URL in environment
2. Check CORS configuration
3. Test API endpoint accessibility
4. Review network/firewall rules

### Build Failures
1. Clear node_modules and reinstall
2. Check for dependency conflicts
3. Verify Node.js version compatibility
4. Review build error messages

### Performance Issues
1. Enable production mode
2. Check database queries
3. Review API response times
4. Analyze bundle size

---

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Security audits
npm audit
npm audit fix

# Rebuild application
npm run build
pm2 restart student-portal
```

### Database Migrations
- Coordinate with backend team
- Test in staging environment
- Schedule maintenance windows

### Monitoring
- Review error logs daily
- Check performance metrics weekly
- Update dependencies monthly
- Security patches immediately

---

## Support & Documentation

### Resources
- Next.js Documentation: https://nextjs.org/docs
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs

### Contact
- Technical Support: tech@gua.edu.pl
- Emergency Contact: +1-XXX-XXX-XXXX

---

## Rollback Procedure

### Using PM2
```bash
# Stop current version
pm2 stop student-portal

# Start previous version
cd /var/www/student-portal-backup
pm2 start npm --name "student-portal" -- start
```

### Using Docker
```bash
# Tag current version
docker tag student-portal:latest student-portal:backup

# Pull previous version
docker pull student-portal:previous

# Restart container
docker-compose up -d
```

### Using Git
```bash
# Revert to previous commit
git revert HEAD
git push

# Redeploy
npm run build
pm2 restart student-portal
```

---

This deployment guide provides comprehensive instructions for deploying the Student Portal in various environments.
