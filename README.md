# Cyarika Private Portal

A secure, private portal with username/password authentication, rich text editing, document management, and Matrix messaging. Protected by Tailscale VPN for maximum security.

## Features

✨ **Secure Authentication** - Username/password login with Passport.js  
📝 **Rich Text Editor** - Tiptap 3.0 with full extensions  
📁 **Document Management** - Nested folders, upload/download (Google Drive-like)  
💬 **Matrix Messaging** - Real-time messaging between users  
� **Character Sheets** - D&D-style character sheets with dice rolling to Discord  
🎮 **PathCompanion Integration** - Import Pathfinder 2e characters from PathCompanion.com  
🎨 **Obsidian-like UI** - Dark theme with sidebar navigation  
🔒 **Tailscale VPN** - Network-level security, no public exposure  
☁️ **AWS S3 Storage** - Secure cloud file storage  
🐘 **PostgreSQL** - Reliable data persistence (Neon serverless)

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Passport.js for authentication
- PostgreSQL with Drizzle ORM
- AWS S3 for file storage
- Matrix SDK for messaging

### Frontend
- React + TypeScript
- Tiptap 3.0 rich text editor
- Vite for fast development
- Axios for API calls

### Infrastructure
- AWS EC2 (free tier compatible)
- AWS S3 for file storage
- PostgreSQL database
- Tailscale for VPN access
- Nginx reverse proxy

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL
- AWS account (for S3)
- Tailscale account

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd cyarika
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/cyarika
SESSION_SECRET=your-secret-key-here
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=cyarika-documents
MATRIX_HOMESERVER_URL=https://matrix.org
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

**Discord Webhook Setup (Optional):**
1. Go to your Discord server settings → Integrations → Webhooks
2. Create a new webhook or copy an existing one
3. Add the webhook URL to your `.env` file
4. Dice rolls from character sheets will be posted to this Discord channel

### 3. Setup Database

This project uses **Neon** (serverless PostgreSQL), so no local database setup needed!

```bash
# Just push your schema to Neon
cd backend
npm run db:push
```

### 4. Run Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access at http://localhost:5173

## Production Deployment

### AWS EC2 Setup

1. **Launch EC2 Instance**
   - Amazon Linux 2 or Ubuntu
   - t2.micro (free tier)
   - Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Run Deployment Script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/cyarika
   sudo ln -s /etc/nginx/sites-available/cyarika /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d cyarika.com
   ```

### AWS S3 Setup

1. Create S3 bucket: `cyarika-documents`
2. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://cyarika.com"],
       "ExposeHeaders": []
     }
   ]
   ```
3. Create IAM user with S3 access
4. Add credentials to `.env`

### Tailscale Setup

See [TAILSCALE.md](TAILSCALE.md) for detailed instructions.

Quick steps:
```bash
# On EC2 server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --advertise-tags=tag:cyarika

# On client devices
# Install Tailscale and join your tailnet
```

Configure Nginx to only listen on Tailscale IP for maximum security.

### Matrix Setup

See [MATRIX.md](MATRIX.md) for detailed instructions.

**Recommended for simplicity**: Use Matrix.org public homeserver
- Create accounts at app.element.io
- Use credentials in backend

**For self-hosting**: Install Synapse on separate t2.micro instance

## Database Schema

### Users
- id, username, password (hashed), email, createdAt

### Documents
- id, name, content, userId, parentId (for folders), isFolder
- s3Key (for uploaded files), mimeType, size
- createdAt, updatedAt

### Shared Documents
- id, documentId, userId, canEdit, createdAt

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/folder` - Create folder
- `POST /api/documents/document` - Create/update document
- `POST /api/documents/upload` - Upload file
- `GET /api/documents/download/:id` - Get download URL
- `DELETE /api/documents/:id` - Delete document/folder

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/room/:roomId` - Get messages
- `POST /api/messages/dm` - Create/get DM room

### Character Sheets
- `GET /api/documents/character-sheets` - List all character sheets
- `POST /api/documents/character-sheets` - Create character sheet
- `PUT /api/documents/character-sheets/:id` - Update character sheet
- `DELETE /api/documents/character-sheets/:id` - Delete character sheet
- `POST /api/documents/character-sheets/:id/roll` - Roll dice (with Discord webhook)

### PathCompanion Integration
- `POST /api/pathcompanion/login` - Login to PathCompanion account
- `POST /api/pathcompanion/characters` - Get PathCompanion character list
- `POST /api/pathcompanion/import` - Import character from PathCompanion
- `POST /api/pathcompanion/sync/:id` - Sync character updates from PathCompanion

See [PATHCOMPANION_INTEGRATION.md](PATHCOMPANION_INTEGRATION.md) for detailed integration docs.

## Security Considerations

✅ **Network Security**: Tailscale VPN protects against public internet threats  
✅ **Authentication**: Bcrypt password hashing, session management  
✅ **Rate Limiting**: Prevents brute force attacks  
✅ **CORS**: Restricted to your domain  
✅ **Helmet.js**: Security headers  
✅ **HTTPS**: SSL/TLS encryption  
✅ **Environment Variables**: Secrets not in code  
✅ **Database**: Parameterized queries prevent SQL injection  

## Cost Estimate (AWS Free Tier)

- **EC2 t2.micro**: Free for 12 months (750 hrs/month)
- **S3**: 5GB free storage, 20,000 GET, 2,000 PUT
- **Data Transfer**: 15GB/month free
- **After free tier**: ~$10-15/month for light usage

## Maintenance

### Backups
```bash
# Database backup
pg_dump cyarika > backup.sql

# S3 files are already backed up by AWS
```

### Updates
```bash
git pull
npm install
npm run build --workspace=frontend
npm run build --workspace=backend
pm2 restart cyarika-backend
```

### Monitoring
```bash
# View logs
pm2 logs cyarika-backend

# Check status
pm2 status
```

## Development Tips

- Use `npm run dev` for hot reload during development
- Backend runs on port 3000, frontend on 5173
- Vite proxy forwards `/api` requests to backend
- Check browser console and terminal for errors

## Troubleshooting

**Can't connect to database**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`

**File upload fails**
- Verify AWS credentials
- Check S3 bucket permissions and CORS

**Matrix messages not working**
- Verify MATRIX_HOMESERVER_URL
- Check Matrix credentials
- For self-hosted: ensure Synapse is running

**PathCompanion import fails**
- Verify PathCompanion username/password are correct
- Check that you have characters in your PathCompanion account
- See [PATHCOMPANION_TESTING.md](PATHCOMPANION_TESTING.md) for detailed troubleshooting

**Can't access via Tailscale**
- Verify Tailscale is running: `tailscale status`
- Check ACLs in Tailscale admin
- Ensure Nginx is listening on Tailscale IP

## Future Enhancements

- [ ] Real-time collaborative editing
- [ ] Mobile apps
- [ ] End-to-end encryption for documents
- [ ] Version history
- [ ] Search functionality
- [ ] Tags and metadata
- [ ] Shared folders between users
- [ ] Import skills, feats, and spells from PathCompanion
- [ ] Two-way sync with PathCompanion
- [ ] Support for additional character systems (D&D 5e, etc.)

## License

MIT

## Support

For issues, please check:
1. [TAILSCALE.md](TAILSCALE.md) - VPN setup
2. [MATRIX.md](MATRIX.md) - Messaging setup
3. [PATHCOMPANION_INTEGRATION.md](PATHCOMPANION_INTEGRATION.md) - PathCompanion integration
4. [PATHCOMPANION_TESTING.md](PATHCOMPANION_TESTING.md) - Testing guide
5. GitHub Issues (if public repo)

---

**Note**: This is a private portal designed for 2 users. For more users, consider adding user management features and adjusting rate limits.
