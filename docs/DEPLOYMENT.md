# Deployment Guide - VDS Setup

## Prerequisites

- VDS/VPS with Ubuntu 22.04 LTS (minimum 2GB RAM, 2 CPU cores)
- Domain: gua.edu.pl (DNS configured)
- SSH access to server

## Step 1: Server Preparation

### Update system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install required packages
```bash
# .NET 8 Runtime
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0 --runtime aspnetcore

# PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Nginx
sudo apt install nginx -y

# Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Database Setup

### Create database and user
```bash
sudo -u postgres psql

CREATE DATABASE gua_db;
CREATE USER gua_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gua_db TO gua_user;
\q
```

### Configure PostgreSQL for remote access (optional)
Edit `/etc/postgresql/14/main/postgresql.conf`:
```
listen_addresses = 'localhost'
```

## Step 3: Backend Deployment

### Create deployment directory
```bash
sudo mkdir -p /var/www/gua/backend
sudo chown $USER:$USER /var/www/gua
```

### Publish .NET application (from local machine)
```bash
cd backend/GUA.Api
dotnet publish -c Release -o ./publish
scp -r ./publish/* user@your-server:/var/www/gua/backend/
```

### Configure appsettings
Create `/var/www/gua/backend/appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=gua_db;Username=gua_user;Password=your_secure_password"
  },
  "Jwt": {
    "Secret": "your-256-bit-secret-key-here",
    "Issuer": "gua.edu.pl",
    "Audience": "gua.edu.pl",
    "ExpirationMinutes": 60
  },
  "Brevo": {
    "SmtpHost": "smtp-relay.brevo.com",
    "SmtpPort": 587,
    "ApiKey": "your-brevo-api-key",
    "SenderEmail": "noreply@gua.edu.pl",
    "SenderName": "Global University America"
  }
}
```

### Create systemd service
Create `/etc/systemd/system/gua-backend.service`:
```ini
[Unit]
Description=GUA Backend API
After=network.target

[Service]
WorkingDirectory=/var/www/gua/backend
ExecStart=/usr/bin/dotnet /var/www/gua/backend/GUA.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=gua-backend
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

### Start backend service
```bash
sudo systemctl daemon-reload
sudo systemctl enable gua-backend
sudo systemctl start gua-backend
sudo systemctl status gua-backend
```

## Step 4: Frontend Deployment

### Build and deploy (from local machine)
```bash
# Admin Panel
cd frontend/apps/admin-panel
npm run build
scp -r .next user@your-server:/var/www/gua/admin-panel/

# Repeat for other apps
```

### Create systemd services for Next.js apps
Similar pattern for each app, example for admin-panel:

Create `/etc/systemd/system/gua-admin.service`:
```ini
[Unit]
Description=GUA Admin Panel
After=network.target

[Service]
WorkingDirectory=/var/www/gua/admin-panel
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
User=www-data
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

## Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/gua`:
```nginx
server {
    listen 80;
    server_name gua.edu.pl www.gua.edu.pl;

    # Public site
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Student Portal
    location /student {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Faculty Portal
    location /faculty {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (uploads, etc.)
    location /uploads {
        alias /var/www/gua/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/gua /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: SSL Certificate

```bash
sudo certbot --nginx -d gua.edu.pl -d www.gua.edu.pl
```

Auto-renewal test:
```bash
sudo certbot renew --dry-run
```

## Step 7: Automated Backups

Create `/usr/local/bin/gua-backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gua"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U gua_user gua_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/gua/uploads

# Delete backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

Make executable and schedule:
```bash
chmod +x /usr/local/bin/gua-backup.sh
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/gua-backup.sh
```

## Step 8: Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Monitoring

Check service status:
```bash
sudo systemctl status gua-backend
sudo journalctl -u gua-backend -f
```

Check logs:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

**Note**: This is a basic deployment guide. For production, consider:
- Database connection pooling
- Redis for caching
- CDN for static assets
- Enhanced monitoring (Prometheus, Grafana)
- Log aggregation (ELK stack)
