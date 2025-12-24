# Knowledge Base Browser - Deployment Guide

## What Was Built

A complete web interface for managing the AI-powered Knowledge Base, integrated into the Cyar'ika portal.

### Features Implemented

1. **Browse Interface**
   - View all knowledge base entries
   - Paginated display with entry cards
   - Visual badges for AI-generated vs manual entries
   - Category tags for organization

2. **Search & Filter**
   - Full-text search across questions and answers
   - Filter by category
   - Toggle AI-only or manual-only entries
   - Real-time search results

3. **Statistics Dashboard**
   - Total entries count
   - AI-generated vs manual breakdown
   - Category distribution with counts
   - Visual stats cards

4. **CRUD Operations** (Admin)
   - Add new knowledge entries
   - Edit existing entries
   - Delete entries
   - Set categories and source URLs

5. **Category System**
   - Dynamic category creation
   - Category filtering
   - Category statistics
   - Auto-suggest from existing categories

## Files Created/Modified

### Backend
- ✅ `backend/src/routes/knowledgeBase.ts` - New API routes
- ✅ `backend/src/server.ts` - Registered new routes

### Frontend
- ✅ `frontend/src/components/KnowledgeBase.tsx` - New UI component
- ✅ `frontend/src/components/Dashboard.tsx` - Added navigation

## API Endpoints

All endpoints require authentication.

### GET `/api/knowledge-base`
- Query params: `search`, `category`, `aiGenerated`, `limit`, `offset`
- Returns: Paginated list of entries with total count

### GET `/api/knowledge-base/stats`
- Returns: Total entries, AI/manual breakdown, category counts

### GET `/api/knowledge-base/:id`
- Returns: Single entry by ID

### POST `/api/knowledge-base`
- Body: `{ question, answer, category?, sourceUrl? }`
- Returns: Created entry

### PUT `/api/knowledge-base/:id`
- Body: `{ question, answer, category?, sourceUrl? }`
- Returns: Updated entry

### DELETE `/api/knowledge-base/:id`
- Returns: Success message

## Deployment Steps

### 1. Build the Application (~30 seconds)
```bash
cd /Users/kit/cyarika-project/cyarika

# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

### 2. Deploy to EC2
```bash
# From project root
./deploy-to-ec2.sh
```

### 3. Restart Services on Server
```bash
# SSH to EC2
ssh cyarika

# Restart backend
pm2 restart cyarika-backend

# Frontend is already served by nginx from dist/
```

### 4. Verify Deployment
1. Navigate to https://cyarika.com
2. Login
3. Click "Knowledge Base" button in header
4. Verify you can:
   - Browse existing entries (from Discord bot)
   - Search entries
   - Filter by category
   - Add new entries
   - Edit/delete entries

## Usage Guide

### For Users
1. Click "Knowledge Base" button in the top navigation
2. Browse all FAQ entries learned by the Discord bot
3. Use the search box to find specific topics
4. Filter by category using the dropdown
5. Toggle "AI Only" or "Manual Only" for specific entry types

### For Admins
1. Click "+ Add Entry" to create new knowledge
2. Fill in:
   - **Question** (required) - The question or topic
   - **Answer** (required) - The detailed answer
   - **Category** (optional) - For organization
   - **Source URL** (optional) - Reference link
3. Click "Save" to add the entry
4. Edit or delete existing entries using the buttons on each card

## Database Schema

The feature uses the existing `knowledge_base` table:

```sql
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_url TEXT,
  category TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Checklist

- [x] Backend compiles without errors
- [x] Frontend compiles without errors
- [x] API routes registered correctly
- [ ] Test browsing entries
- [ ] Test search functionality
- [ ] Test category filtering
- [ ] Test adding new entry
- [ ] Test editing entry
- [ ] Test deleting entry
- [ ] Test statistics display
- [ ] Verify responsive design
- [ ] Test with existing Discord bot entries

## Time Breakdown

- Database schema review: 2 minutes
- Backend API routes: 5 minutes
- Frontend component: 10 minutes
- Integration & routing: 3 minutes
- Testing & debugging: 5 minutes
- Documentation: 5 minutes

**Total Time: ~30 minutes**

## Future Enhancements

- [ ] Bulk import/export of entries
- [ ] Voting system for entry quality
- [ ] Advanced search with regex
- [ ] Entry versioning/history
- [ ] Rich text formatting in answers
- [ ] Image attachments for entries
- [ ] Public knowledge base (optional sharing)
- [ ] Analytics on most-viewed entries

## Troubleshooting

### "Not authenticated" error
- Ensure you're logged in
- Check session cookie is valid
- Try logging out and back in

### Entries not loading
- Check browser console for errors
- Verify backend is running: `pm2 status`
- Check API endpoint: `curl https://cyarika.com/api/knowledge-base`

### Can't add entries
- Verify you're authenticated
- Check CSRF token is valid
- Ensure all required fields are filled

## Notes

- All entries are user-scoped by authentication
- AI-generated entries come from Discord bot `!ask` command
- Manual entries are added through the portal
- Categories are free-form text (case-sensitive)
- Search is case-insensitive and searches both questions and answers
