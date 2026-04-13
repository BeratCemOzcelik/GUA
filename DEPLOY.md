# GUA Deployment Guide - Windows Server

**Server IP:** 93.180.132.185
**Access:** RDP

## Erişim Adresleri

| Servis | URL |
|--------|-----|
| Public Site | http://93.180.132.185:3004 |
| Admin Panel | http://93.180.132.185:3000 |
| Student Portal | http://93.180.132.185:3001 |
| Faculty Portal | http://93.180.132.185:3003 |
| Backend API | http://93.180.132.185:5000 |
| Swagger | http://93.180.132.185:5000/swagger |

---

## Adım 1: Gerekli Yazılımlar (Sunucuda)

Bunların kurulu olduğundan emin ol:
- **Node.js** (v18+): https://nodejs.org
- **.NET 8 SDK**: https://dotnet.microsoft.com/download/dotnet/8.0
- **PostgreSQL** (v15+): https://www.postgresql.org/download/windows/
- **Git** (opsiyonel): https://git-scm.com

---

## Adım 2: Proje Dosyalarını Sunucuya Kopyala

Tüm proje klasörünü sunucuya kopyala (RDP ile sürükle-bırak veya zip ile):
```
C:\GUA\
├── backend\
├── frontend\
│   ├── admin-panel\
│   ├── student-portal\
│   ├── faculty-portal\
│   └── public-site\
└── assets\
```

---

## Adım 3: PostgreSQL Ayarları

1. PostgreSQL'i kur ve başlat
2. `pgAdmin` veya `psql` ile veritabanı oluştur:
```sql
CREATE DATABASE gua_db;
```
3. `appsettings.Production.json` dosyasındaki connection string'i güncelle (şifre vs.)

---

## Adım 4: Firewall Port Aç

**PowerShell'i Administrator olarak aç** ve şu komutları çalıştır:

```powershell
New-NetFirewallRule -DisplayName "GUA Backend" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "GUA Admin Panel" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "GUA Student Portal" -Direction Inbound -Port 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "GUA Faculty Portal" -Direction Inbound -Port 3003 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "GUA Public Site" -Direction Inbound -Port 3004 -Protocol TCP -Action Allow
```

---

## Adım 5: Backend Build & Çalıştır

**CMD veya PowerShell aç:**

```powershell
cd C:\GUA\backend\GUA.Api

# Publish (release build)
dotnet publish -c Release -o C:\GUA\publish\backend

# Çalıştır
cd C:\GUA\publish\backend
set ASPNETCORE_ENVIRONMENT=Production
dotnet GUA.Api.dll
```

Backend başladığında `http://93.180.132.185:5000/swagger` adresini tarayıcıda kontrol et.

---

## Adım 6: Frontend Build & Çalıştır

Her frontend için ayrı CMD/PowerShell penceresi aç:

### Admin Panel (Port 3000)
```powershell
cd C:\GUA\frontend\admin-panel
npm install
npm run build
set PORT=3000
npm run start
```

### Student Portal (Port 3001)
```powershell
cd C:\GUA\frontend\student-portal
npm install
npm run build
set PORT=3001
npm run start
```

### Faculty Portal (Port 3003)
```powershell
cd C:\GUA\frontend\faculty-portal
npm install
npm run build
set PORT=3003
npm run start
```

### Public Site (Port 3004)
```powershell
cd C:\GUA\frontend\public-site
npm install
npm run build
set PORT=3004
npm run start
```

---

## Adım 7: Windows Servisi Olarak Çalıştır (Opsiyonel - Kalıcı)

CMD pencereleri kapanınca servisler durur. Kalıcı çalışması için **NSSM** kullan:

### NSSM Kur
https://nssm.cc/download adresinden indir, `nssm.exe`'yi `C:\nssm\` klasörüne koy.

### Backend Servisi
```powershell
C:\nssm\nssm.exe install GUA-Backend "C:\Program Files\dotnet\dotnet.exe" "C:\GUA\publish\backend\GUA.Api.dll"
C:\nssm\nssm.exe set GUA-Backend AppDirectory "C:\GUA\publish\backend"
C:\nssm\nssm.exe set GUA-Backend AppEnvironmentExtra "ASPNETCORE_ENVIRONMENT=Production"
C:\nssm\nssm.exe start GUA-Backend
```

### Frontend Servisleri
Her frontend için:

```powershell
# Admin Panel
C:\nssm\nssm.exe install GUA-Admin "C:\Program Files\nodejs\node.exe" "C:\GUA\frontend\admin-panel\node_modules\.bin\next" "start" "-p" "3000"
C:\nssm\nssm.exe set GUA-Admin AppDirectory "C:\GUA\frontend\admin-panel"
C:\nssm\nssm.exe start GUA-Admin

# Student Portal
C:\nssm\nssm.exe install GUA-Student "C:\Program Files\nodejs\node.exe" "C:\GUA\frontend\student-portal\node_modules\.bin\next" "start" "-p" "3001"
C:\nssm\nssm.exe set GUA-Student AppDirectory "C:\GUA\frontend\student-portal"
C:\nssm\nssm.exe start GUA-Student

# Faculty Portal
C:\nssm\nssm.exe install GUA-Faculty "C:\Program Files\nodejs\node.exe" "C:\GUA\frontend\faculty-portal\node_modules\.bin\next" "start" "-p" "3003"
C:\nssm\nssm.exe set GUA-Faculty AppDirectory "C:\GUA\frontend\faculty-portal"
C:\nssm\nssm.exe start GUA-Faculty

# Public Site
C:\nssm\nssm.exe install GUA-PublicSite "C:\Program Files\nodejs\node.exe" "C:\GUA\frontend\public-site\node_modules\.bin\next" "start" "-p" "3004"
C:\nssm\nssm.exe set GUA-PublicSite AppDirectory "C:\GUA\frontend\public-site"
C:\nssm\nssm.exe start GUA-PublicSite
```

### Servisleri Yönet
```powershell
# Durumu kontrol et
C:\nssm\nssm.exe status GUA-Backend

# Durdur
C:\nssm\nssm.exe stop GUA-Backend

# Başlat
C:\nssm\nssm.exe start GUA-Backend

# Kaldır
C:\nssm\nssm.exe remove GUA-Backend confirm
```

---

## Adım 8: Doğrulama

Tarayıcıdan kontrol et:
1. http://93.180.132.185:5000/swagger → Swagger açılmalı
2. http://93.180.132.185:3004 → Public site görünmeli
3. http://93.180.132.185:3000 → Admin panel login
4. http://93.180.132.185:3001 → Student portal login
5. http://93.180.132.185:3003 → Faculty portal login

---

## Sorun Giderme

### Port kullanımda hatası
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Backend log kontrolü
```powershell
# NSSM logları
C:\nssm\nssm.exe set GUA-Backend AppStdout C:\GUA\logs\backend-out.log
C:\nssm\nssm.exe set GUA-Backend AppStderr C:\GUA\logs\backend-err.log
```

### Veritabanı bağlantı hatası
- PostgreSQL servisinin çalıştığını kontrol et: `services.msc`
- `pg_hba.conf` dosyasında localhost bağlantısına izin verildiğinden emin ol
- `appsettings.Production.json`'daki şifreyi kontrol et
