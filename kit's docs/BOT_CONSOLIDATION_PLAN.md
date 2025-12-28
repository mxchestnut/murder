# Write Pretend Bot Consolidation Plan

## Overview
Consolidate from dual-bot architecture (My1e Party + Write Pretend) to a single "Write Pretend" bot with Stripe-based premium features.

## Changes Required

### 1. Backend - discordBot.ts
- ✅ Remove `BotType` type
- ✅ Remove dual client variables (`my1epartyClient`, `writepretendClient`)
- ✅ Simplify to single `botClient` variable
- ✅ Remove bot type parameter from `initializeDiscordBot()`
- ✅ Simplify global guards (single client, single init flag)
- ✅ Merge `handleMy1ePartyCommands()` and `handleWritePretendCommands()` into single `handleCommands()`
- ✅ Add tier checks for premium commands (feat, spell, ask, learn, learnurl)
- ✅ Update all `botClient` references to use the single client
- ✅ Fix branding (all "My1e Party" → "Write Pretend" / "my1e.party")
- ✅ Add debug logging for authentication troubleshooting

### 2. Backend - server.ts
- ✅ Remove My1e Party bot initialization (only one bot now)
- ✅ Update to call `initializeDiscordBot(WRITEPRETEND_BOT_TOKEN)` once
- ✅ Remove botType logic
- ✅ Fix database connection (remove EC2 check, use NODE_ENV only)

### 3. Command Structure
**Free Tier Commands** (Everyone):
- !connect, !syncall
- !setchar, !char, !profile
- !roll, !<stat>, !<skill>
- Character proxying (CharName: message)
- !hc (HC list)
- !remember, !memories
- !gmnote, !gmnotes (admin)
- !time, !timeset (admin)
- !hall
- !announce (admin)

**RP Tier Commands** (Requires Stripe subscription):
- !prompt, !trope
- !dailyprompt (admin)
- !ask, !learn, !learnurl (AI features)
- !feat, !spell (AI character generation)
- AI-enhanced memories

### 4. Tier Check Implementation
```typescript
// Check if user has RP tier access
async function hasRpTier(discordUserId: string): Promise<boolean> {
  const tier = await getUserTierFromDiscord(db, discordUserId);
  return tier === 'rp';
}

// Example usage in command handler
if (!await hasRpTier(message.author.id)) {
  await message.reply('⭐ This command requires RP tier subscription. Visit https://my1e.party/settings to upgrade!');
  return;
}
```

### 5. Frontend Updates
- Update bot invite URL (only one bot now)
- Update DiscordBotInvite.tsx to show single bot
- Update documentation
- Update Settings page (remove Write Pretend bot section)

### 6. Configuration Files
- ecosystem.config.js - no changes needed
- .env - Remove WRITEPRETEND_BOT_TOKEN (optional)
- Keep Stripe configuration

### 7. Database
- No schema changes needed
- Keep subscription_tier field in users table
- Keep Stripe fields

### 8. Documentation Updates
- README.md - Update to reflect single bot
- PROJECT_AUDIT.md - Update status
- DISCORD_COMMANDS_REFERENCE.md - Consolidate commands

## Deployment Strategy

### Phase 1: Code Changes (Local) ✅ COMPLETE
1. ✅ Consolidate bot architecture
2. ✅ Merge command handlers
3. ✅ Add tier checks to premium commands
4. ⏳ Update frontend (next step)

### Phase 2: Testing (Local) ✅ COMPLETE
1. ✅ Test all free commands (`!connect`, `!setchar`, `!profile`, `!help`)
2. ✅ Test RP tier commands with active subscription (`!prompt`, `!trope`, `!ask`, `!feat`, `!spell`, `!memory` all working)
3. ✅ Test tier checks (checkRpTier() working correctly)
4. ⏳ Test subscription flow (verify upgrade message for non-RP users)

### Phase 3: Production Deployment ✅ COMPLETE
1. ✅ Commit and push changes
2. ✅ SSH to production server
3. ✅ Pull latest code
4. ✅ Build backend
5. ✅ Restart PM2
6. ✅ Monitor logs - bot started successfully

### Phase 4: Cleanup ⏳ PENDING
1. ⏳ Test premium tier commands
2. ⏳ Update frontend DiscordBotInvite.tsx
3. ⏳ Update documentation/README
4. ⏳ Remove debug logging
5. ⏳ Archive old bot token from AWS Secrets Manager

## Rollback Plan
If issues arise:
1. Revert git commit
2. Deploy previous version
3. Restart both bots
4. Investigate issues

## Risks
- **Medium**: Users may have bookmarked Write Pretend bot invite URL
- **Low**: Existing webhooks may reference Write Pretend
- **Low**: Session state lost on restart

## Benefits
✅ Simpler architecture (1 bot instead of 2)
✅ Easier to maintain
✅ Single bot invite flow
✅ Keep Stripe integration (lower fees than Discord)
✅ Better user experience (one bot for everything)

## Timeline
- Code changes: 1-2 hours
- Testing: 30 minutes
- Deployment: 15 minutes
- **Total: ~3 hours**

---

**Ready to proceed?**
This is a significant refactoring but will simplify the codebase considerably.
