# Cyarika Private Portal - Project Snapshot
**Date:** December 19, 2025  
**Status:** ✅ Fully Deployed and Operational

## 🌐 Live Site
- **URL:** https://cyarika.com (and https://www.cyarika.com)
- **SSL Certificate:** Valid until March 19, 2026 (auto-renewal configured)
- **Status:** Active and accessible

## 🖥️ Infrastructure

### AWS Resources
- **EC2 Instance:** 
  - ID: `i-0038431a2b62c1dbf`
  - Type: t2.micro (free tier)
  - IP: 54.242.214.56
  - OS: Ubuntu 22.04
  - SSH Key: `cyarika-key.pem` (in project root)
  
- **Security Group:** `sg-0f04474e55f42ab5b`
  - Port 22 (SSH)
  - Port 80 (HTTP - redirects to HTTPS)
  - Port 443 (HTTPS)

- **Route53 Hosted Zone:** Z01482473LHFKM7LFNJKR
  - Nameservers: ns-464.awsdns-58.com, ns-583.awsdns-08.net, ns-1345.awsdns-40.org, ns-1839.awsdns-37.co.uk
  - A records: cyarika.com → 54.242.214.56
  - A records: www.cyarika.com → 54.242.214.56

- **S3 Bucket:** cyarika-documents (documented but not yet created)

### Server Configuration
- **Node.js:** 20.x
- **Process Manager:** PM2 (backend running as "cyarika")
- **Web Server:** Nginx 1.18.0
  - Config: `/etc/nginx/sites-available/cyarika`
  - Serves frontend from: `/home/ubuntu/cyarika/frontend/dist`
  - Proxies /api to: localhost:3000
- **SSL:** Let's Encrypt (Certbot with auto-renewal)

## 📊 Database
- **Provider:** Neon PostgreSQL (serverless)
- **Connection:** 
  - Host: ep-floral-surf-ad39gk34-pooler.c-2.us-east-1.aws.neon.tech
  - Database: neondb
  - User: neondb_owner
- **Schema Tables:**
  - users (id, username, password, email, created_at)
  - documents (id, name, content, user_id, parent_id, is_folder, s3_key, mime_type, size, created_at, updated_at)
  - shared_documents (id, document_id, user_id, can_edit, created_at)

## 💬 Messaging
- **Platform:** Matrix (matrix.org)
- **Test Room ID:** !mQnVqjtshmxgeXtTlX:matrix.org
- **Access Token:** Configured in server .env (mat_1JL4Yj3ZdXwmJ1sW42CnbB407kAnik_0hC8Zp)

## 🎨 Features Implemented

### ✅ Authentication
- Username/password login with Passport.js
- bcrypt password hashing
- Express session management
- Protected routes

### ✅ Document Management
- Create/edit/delete documents
- Create nested folders
- File upload (S3 ready, bucket not created yet)
- File download with presigned URLs
- Obsidian-like sidebar navigation

### ✅ Rich Text Editor
- Tiptap 3.0 with full extension suite
- Extensions: StarterKit, Link, Image, Table, TaskList, Highlight, TextAlign, Underline, Subscript, Superscript
- Auto-save functionality
- Full formatting toolbar

### ✅ Document Sharing
- Share button in editor toolbar
- Modal to select recipient username
- Sends document link via Matrix message

### ✅ Matrix Messaging
- Messaging panel (slides out from right)
- Test button to send to group room
- Real-time status feedback
- Theme-matched colors

### ✅ Dual Theme System
- **Light Theme:** Cream background (#E9E7D9), brown text (#442727), tan accent (#D2C6B2), gold accent (#927D14)
- **Dark Theme:** Brown background (#442727), cream text (#E9E7D9), same accents
- Theme toggle button (sun/moon icon)
- LocalStorage persistence
- CSS custom properties for consistency

## 📁 Project Structure
```
cyarika/
├── backend/
│   ├── src/
│   │   ├── server.ts (Express app, port 3000)
│   │   ├── config/
│   │   │   ├── passport.ts (LocalStrategy)
│   │   │   └── s3.ts (S3Client config)
│   │   ├── db/
│   │   │   ├── index.ts (Drizzle connection)
│   │   │   └── schema.ts (Database schema)
│   │   ├── middleware/
│   │   │   └── auth.ts (isAuthenticated)
│   │   └── routes/
│   │       ├── auth.ts (register, login, logout, /me)
│   │       ├── documents.ts (CRUD, upload, download)
│   │       └── messages.ts (Matrix send, DM, room messages)
│   ├── drizzle/ (migrations)
│   ├── dist/ (compiled TypeScript)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx (Router, auth check)
│   │   ├── index.css (Theme variables, editor styles)
│   │   ├── components/
│   │   │   ├── Dashboard.tsx (Main layout, theme toggle, share modal)
│   │   │   ├── Editor.tsx (Tiptap editor, share button)
│   │   │   ├── Login.tsx (Login/register form)
│   │   │   ├── MessagingPanel.tsx (Matrix test button, message UI)
│   │   │   └── Sidebar.tsx (Document tree, create/upload/delete)
│   │   └── utils/
│   │       └── api.ts (Axios instance)
│   ├── dist/ (production build)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .env.example (Template)
├── .gitignore
├── package.json (Root workspace)
├── deploy.sh (Deployment script)
├── nginx.conf (Sample nginx config)
├── cyarika-key.pem (SSH key - DO NOT COMMIT)
├── DEPLOYMENT_INFO.md
├── TAILSCALE.md
├── MATRIX.md
└── README.md
```

## 🔐 Environment Variables (Server)
Located at: `/home/ubuntu/cyarika/.env`

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://cyarika.com
DATABASE_URL=postgresql://neondb_owner:npg_RkD5GsQSg4wl@ep-floral-surf-ad39gk34-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=<long_generated_secret>
MATRIX_HOMESERVER_URL=https://matrix.org
MATRIX_ACCESS_TOKEN=mat_1JL4Yj3ZdXwmJ1sW42CnbB407kAnik_0hC8Zp
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-key-here
AWS_S3_BUCKET=cyarika-documents
```

## 🚀 Deployment Process
1. Push code to GitHub: `git push origin main`
2. SSH to server: `ssh -i cyarika-key.pem ubuntu@54.242.214.56`
3. Pull latest: `cd /home/ubuntu/cyarika && git pull`
4. Build frontend: `npm run build --workspace=frontend`
5. Build backend: `npm run build --workspace=backend`
6. Restart PM2: `pm2 restart cyarika`

## 📝 Common Commands

### On Server
```bash
# SSH into server
ssh -i cyarika-key.pem ubuntu@54.242.214.56

# Check PM2 status
pm2 status

# View logs
pm2 logs cyarika

# Restart backend
pm2 restart cyarika

# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check SSL certificate
sudo certbot certificates
```

### Local Development
```bash
# Install dependencies
npm install

# Run backend dev
npm run dev --workspace=backend

# Run frontend dev
npm run dev --workspace=frontend

# Build all
npm run build
```

## ⏭️ Next Steps (Not Yet Implemented)
1. **Tailscale VPN:** Install and configure on EC2 to restrict access
2. **S3 Bucket:** Create bucket and configure credentials for file uploads
3. **Second User:** Register second user account for testing share/messaging
4. **Matrix DM:** Configure direct messaging between two users
5. **Database Backups:** Set up automated Neon backups

## 🔗 Important Links
- **GitHub Repo:** https://github.com/mxchestnut/cyarika
- **Neon Dashboard:** https://console.neon.tech/
- **AWS Console:** https://console.aws.amazon.com/
- **Matrix Element:** https://app.element.io
- **Domain:** Managed via Google Domains, DNS via Route53

## 📞 Account Information
- **Registered User:** Created via registration page
- **Matrix Account:** Has access token configured
- **Neon Database:** Connected and migrated

## 🎯 Project Goals (Achieved)
✅ Private portal with username/password auth  
✅ Tiptap 3.0 rich text editor with all extensions  
✅ Document management with folders (Google Drive-like)  
✅ Matrix messaging integration  
✅ Obsidian-like UI with sidebar  
✅ AWS free tier deployment  
✅ HTTPS with SSL certificates  
✅ Dual theme (light/dark)  
✅ Document sharing via Matrix  
✅ Secure and stable

---

**Note:** Production site is live and operational. No local processes running. Server runs autonomously via PM2 + Nginx.
