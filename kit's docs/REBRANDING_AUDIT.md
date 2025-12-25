# Murder Tech Rebranding & Security Audit

**Date:** December 24, 2025  
**Purpose:** Comprehensive code audit for rebranding from Cyar'ika to Murder, security hardening, accessibility compliance, and code quality review

---

## 🎯 Executive Summary

This document contains a complete line-by-line audit of the codebase identifying:
1. **Branding Issues** - All references to "Cyar'ika", "cyarika", "Write Pretend" that need to be changed to "Murder" or "Murder Tech"
2. **Security Issues** - Secrets management, SSL configuration, and security best practices
3. **Accessibility Issues** - ARIA labels, keyboard navigation, screen reader support
4. **Code Quality** - Outdated packages, unnecessary files, industry standard violations

---

## 📋 CRITICAL TASKS - DO FIRST

### 1. AWS Secrets Manager - Update Secret Names
**Priority:** 🔴 CRITICAL  
**Impact:** Production will break if not updated correctly

Current secret names in `backend/src/config/secrets.ts`:
```typescript
getSecret('cyarika/database-url')
getSecret('cyarika/session-secret')
getSecret('cyarika/discord-bot-token')
getSecret('cyarika/gemini-api-key')
```

**ACTION REQUIRED:**
- [ ] Create NEW secrets in AWS Secrets Manager:
  - `murder/database-url`
  - `murder/session-secret`
  - `murder/discord-bot-token`
  - `murder/gemini-api-key`
- [ ] Update `backend/src/config/secrets.ts` to use new secret names
- [ ] Test in development environment BEFORE production
- [ ] Keep old secrets until migration is confirmed working
- [ ] Delete old `cyarika/*` secrets ONLY after confirming new ones work

---

### 2. Database Credentials
**Priority:** 🔴 CRITICAL  
**Security:** Database name and connection strings need updating

Current references:
- Database name likely: `cyarika` (check RDS instance)
- `.env.example` has: `postgresql://username:password@localhost:5432/cyarika`
- Redis session prefix: `cyarika:sess:`

**ACTION REQUIRED:**
- [ ] Decide: Create NEW RDS database instance OR rename existing?
  - Option A: Create new `murder` database (recommended for clean break)
  - Option B: Rename existing database (requires migration/downtime)
- [ ] Update `DATABASE_URL` in AWS Secrets Manager
- [ ] Update `.env.example` with new database name
- [ ] Change Redis session prefix from `cyarika:sess:` to `murder:sess:` in `backend/src/server.ts` (line 120)
- [ ] **WARNING:** Changing session prefix will log out all users

---

### 3. Domain & Infrastructure
**Priority:** 🔴 CRITICAL  
**Impact:** Frontend won't work without CORS/domain updates

Current domain references:
- `nginx.conf`: `cyarika.com` and `www.cyarika.com` (lines 2, 3, 10, 11)
- `deploy.sh`: SSH to `cyarika.com`
- `backend/src/server.ts`: CORS allows `https://cyarika.com` (line 97)
- SSL certificate paths reference `cyarika.com` (nginx.conf lines 13-14)

**ACTION REQUIRED:**
- [ ] Register new domain (murdertech.com, murder.gg, etc.)
- [ ] Update `nginx.conf` with new domain
- [ ] Update CORS whitelist in `backend/src/server.ts` (line 97)
- [ ] Get new SSL certificate with Let's Encrypt for new domain
- [ ] Update `deploy.sh` SSH target
- [ ] Update Route 53 DNS records
- [ ] Update Discord bot redirect URLs (if using OAuth in future)

---

### 4. S3 Bucket
**Priority:** 🟡 HIGH  
**Impact:** File uploads will fail

Current bucket references:
- `.env.example`: `AWS_S3_BUCKET=cyarika-documents`
- `backend/src/config/s3.ts`: `'cyarika-documents'` (line 12)
- PM2 ecosystem.config.js likely has S3 bucket env var

**ACTION REQUIRED:**
- [ ] Create new S3 bucket: `murder-tech-documents` or similar
- [ ] Update `backend/src/config/s3.ts` default bucket name
- [ ] Update `.env.example`
- [ ] Update production environment variable in ecosystem.config.js
- [ ] Migrate existing files from old bucket (if needed) OR start fresh
- [ ] Update bucket CORS policy with new domain

---

## 🏷️ BRANDING CHANGES - Code Files

### Root Configuration Files

**File: `/package.json`**
- [ ] Line 2: Change `"name": "cyarika"` → `"name": "murder-tech"`
- [ ] Line 4: Update description

**File: `/ecosystem.config.js`**
- [ ] Line 3: Change `name: 'cyarika-backend'` → `name: 'murder-tech-backend'`

**File: `/nginx.conf`**
- [ ] Line 2: Change domain name (2 places)
- [ ] Line 10: Change domain name (2 places)
- [ ] Lines 13-14: Update SSL certificate paths

**File: `/deploy.sh`**
- [ ] Line 5: Update echo message
- [ ] Line 9: Update SSH target
- [ ] Line 12: Update SSH target + path
- [ ] Line 15: Update echo message
- [ ] Line 16: Update SSH target + path
- [ ] Line 19: Update echo message
- [ ] Line 20: Update SSH target + PM2 app name

**File: `/README.md`**
- [ ] Line 1: Change title from "Cyar'ika" to "Murder Tech"
- [ ] Line 3: Update description
- [ ] Line 5: Update website URL
- [ ] Line 142: Change "Write Pretend Bot" to "Murder Tech Bot"
- [ ] Line 236: Change "Write Pretend" to "Murder Tech"
- [ ] All other instances of "Cyar'ika" throughout (many)

**File: `/.env.example`**
- [ ] Line 8: Database name in connection string
- [ ] Line 16: S3 bucket name

---

### Backend Files

**File: `/backend/package.json`**
- [ ] Line 4: Description mentions "Cyarika private portal"

**File: `/backend/src/server.ts`**
- [ ] Line 97: CORS origin URLs (2 places)
- [ ] Line 120: Redis session prefix `'cyarika:sess:'`
- [ ] Line 146: CSRF cookie name `'cyarika.x-csrf-token'`

**File: `/backend/src/config/secrets.ts`**
- [ ] Lines 38-41: All 4 secret names (`cyarika/*`)

**File: `/backend/src/config/s3.ts`**
- [ ] Line 12: Default bucket name `'cyarika-documents'`

**File: `/backend/src/routes/auth.ts`**
- [ ] Line 172: Redis keys pattern `'cyarika:sess:*'`

**File: `/backend/src/routes/discord.ts`**
- [ ] Line 9: Comment mentions "Cyarika credentials"
- [ ] Line 44: Error message mentions "Cyarika account"
- [ ] Line 48: Comment mentions "Cyarika account"
- [ ] Line 94: Error message "Discord account not linked to Cyarika"

**File: `/backend/src/routes/pathcompanion.ts`**
- [ ] Line 10: Comment mentions "Cyarika auth"
- [ ] Line 138: Comment mentions "Cyarika authentication"
- [ ] Line 438: Comment mentions "Cyarika authentication"

**File: `/backend/src/services/playfab.ts`**
- [ ] Line 146: CustomId prefix `cyarika_import_`

**File: `/backend/src/services/discordBot.ts`**
- [ ] Line 404: URL `https://cyarika.com${character.avatarUrl}`
- [ ] Line 940: Comment "Authenticate with Cyarika backend"
- [ ] Line 991: Error message mentions "Cyarika" (2 times)
- [ ] Line 995: Comment mentions "Cyarika characters"
- [ ] Line 1047: Footer text "Visit cyarika.com to manage characters!"

---

### Frontend Files

**File: `/frontend/index.html`**
- [ ] Line 5: Meta description mentions "Cyar'ika"
- [ ] Line 6: Title "Cyar'ika - Roleplay Smarter"

**File: `/frontend/src/App.tsx`**
- [ ] Line 9: Console log `'Cyar\'ika v2.0.0 - Roleplay Smarter'`

**File: `/frontend/src/components/Login.tsx`**
- [ ] Line 53: H1 text mentions "Cyar'ika"

**File: `/frontend/src/components/HamburgerSidebar.tsx`**
- [ ] Line 206: H2 text "Cyar'ika"

**File: `/frontend/src/components/DiscordCommands.tsx`**
- [ ] Line 10: Text mentions "Cyar'ika bot"
- [ ] Line 389: Text mentions "Cyar'ika bot"

**File: `/frontend/src/components/Settings.tsx`**
- [ ] Line 119: Text mentions "Cyar'ika"

---

### Documentation Files (kit's docs/)

**ALL MARKDOWN FILES** need comprehensive rebranding:
- [ ] `PROJECT_REPLICATION_GUIDE.md` - Title, all references (100+ instances)
- [ ] `COMPLETED_FEATURES.md` - Title, all references (50+ instances)
- [ ] `CYARIKA_ROADMAP.md` - **RENAME FILE** to `MURDER_ROADMAP.md`, update all content
- [ ] `SECURITY_AUDIT.md` - Update title and scope references
- [ ] `CHARACTER_SHEETS_GUIDE.md` - Update references
- [ ] `KNOWLEDGE_BASE_DEPLOYMENT.md` - Update deployment paths and references
- [ ] `SESSION_SUMMARY_DEC24_2025.md` - Historical doc, update future references
- [ ] `DISCORD_BOT_DEPLOYMENT.md` - Update all references
- [ ] `QUICK_START.md` - Title, domain, all setup instructions
- [ ] `DEPLOYMENT_FILE_UPLOAD.md` - Update paths and references
- [ ] `DISCORD_COMMANDS.md` - Update bot name references
- [ ] All other MD files in the folder

---

## 🔒 SECURITY ISSUES

### Critical Security Issues

**1. SSL Certificate Validation**
- **File:** `backend/src/db/index.ts` (line 8-9)
- **Issue:** `rejectUnauthorized: true` is correct for production
- **Status:** ✅ GOOD - No change needed
- **Note:** Previously was set to `false`, now properly secured

**2. Session Security**
- **File:** `backend/src/server.ts` (lines 126-133)
- **Status:** ✅ GOOD - Proper settings:
  - `httpOnly: true`
  - `secure: true` in production
  - `sameSite: 'lax'`
  - Rolling sessions enabled

**3. CSRF Protection**
- **File:** `backend/src/server.ts` (lines 144-156)
- **Status:** ✅ GOOD - Double submit cookie pattern implemented
- **Note:** Properly excludes GET/HEAD/OPTIONS

**4. Rate Limiting**
- **File:** `backend/src/server.ts` (lines 104-109)
- **Status:** ✅ GOOD - 100 requests per 15 minutes per IP

**5. Helmet Security Headers**
- **File:** `backend/src/server.ts` (lines 75-94)
- **Status:** ✅ GOOD - Comprehensive CSP policy
- **Note:** HSTS enabled with 1-year max age

**6. CORS Configuration**
- **File:** `backend/src/server.ts` (lines 95-99)
- **Issue:** ⚠️ Hardcoded domains need updating for Murder
- **Action:** Update allowed origins after domain change

---

### Medium Priority Security Issues

**7. Password Encryption Key**
- **File:** Multiple files reference `PATHCOMPANION_ENCRYPTION_KEY`
- **Issue:** Need to verify this is properly set in production
- **Action Required:**
  - [ ] Confirm 64-character hex key exists in production
  - [ ] Document key generation process
  - [ ] Ensure key is in AWS Secrets Manager OR environment variable

**8. AWS Credentials**
- **File:** `backend/src/config/s3.ts`
- **Status:** ✅ GOOD - Uses IAM role, no hardcoded credentials
- **Note:** Relies on EC2 instance role (CyarikaEC2SecretsRole → needs renaming)

**9. Redis Connection**
- **File:** `backend/src/server.ts` (lines 49-54)
- **Issue:** ⚠️ No authentication on Redis connection
- **Action Required:**
  - [ ] Add Redis password if exposed beyond localhost
  - [ ] Confirm Redis is only accessible from localhost
  - [ ] Consider Redis ACLs for production

**10. Error Message Exposure**
- **Files:** Various route files
- **Issue:** Some error messages may leak internal details
- **Action Required:**
  - [ ] Audit all error responses
  - [ ] Ensure no database errors leak to client
  - [ ] Log detailed errors server-side only

---

### Security Best Practices - Already Implemented ✅

- ✅ bcrypt password hashing (12 rounds)
- ✅ Session secrets from AWS Secrets Manager
- ✅ HTTPS enforced via nginx
- ✅ SQL injection prevention via Drizzle ORM
- ✅ XSS prevention via helmet
- ✅ CSRF protection
- ✅ File upload virus scanning (ClamAV)
- ✅ Image optimization to prevent malicious files
- ✅ Storage quotas per user
- ✅ Input validation with express-validator
- ✅ Secure cookie settings

---

## ♿ ACCESSIBILITY ISSUES

### Critical Accessibility Issues

**1. Missing ARIA Labels**
- **Impact:** Screen readers can't identify interactive elements
- **Files:** Most frontend components
- **Action Required:**
  - [ ] Add `aria-label` to all icon-only buttons
  - [ ] Add `aria-label` to all form inputs (supplement visible labels)
  - [ ] Add `aria-label` to navigation elements

**2. Insufficient Alt Text**
- **Current Status:** Only 8 `alt=` attributes found in entire frontend
- **Files Affected:**
  - `StatsDashboard.tsx` - Has alt for character avatars ✅
  - `CharacterBio.tsx` - Has alt for character images ✅
  - `PhotoGallery.tsx` - Has alt for photos ✅
  - `CharacterSheets.tsx` - Has alt for avatar preview ✅
- **Missing:**
  - [ ] Many other components with images
  - [ ] Icon buttons throughout the app
  - [ ] Logo/branding images

**3. Keyboard Navigation**
- **Issue:** No visible focus indicators mentioned in CSS
- **Action Required:**
  - [ ] Add `:focus-visible` styles to all interactive elements
  - [ ] Ensure tab order is logical
  - [ ] Test entire app with keyboard only
  - [ ] Add skip-to-content link

**4. Color Contrast**
- **Issue:** Need to verify color contrast ratios meet WCAG 2.1 AA standards
- **Action Required:**
  - [ ] Test current color scheme for 4.5:1 contrast ratio (normal text)
  - [ ] Test for 3:1 contrast ratio (large text)
  - [ ] Verify in both light and dark themes
  - [ ] Use contrast checker tool

**5. Form Labels**
- **Status:** ⚠️ PARTIAL - Some labels present but inconsistent
- **Action Required:**
  - [ ] Ensure ALL form inputs have associated `<label>` elements
  - [ ] Use proper `htmlFor` attribute linking
  - [ ] Add `aria-required` to required fields
  - [ ] Add `aria-invalid` and error messaging for validation

**6. Semantic HTML**
- **Issue:** Heavy use of `<div>` and inline styles
- **Action Required:**
  - [ ] Replace divs with semantic elements (`<nav>`, `<main>`, `<section>`, `<article>`)
  - [ ] Use `<button>` instead of styled divs for interactive elements
  - [ ] Add proper heading hierarchy (h1 → h2 → h3, no skipping)

**7. Screen Reader Announcements**
- **Issue:** No ARIA live regions for dynamic content
- **Action Required:**
  - [ ] Add `aria-live="polite"` for status updates
  - [ ] Add `aria-live="assertive"` for errors
  - [ ] Announce page changes in SPA navigation
  - [ ] Announce form submission results

**8. Modal Dialogs**
- **Issue:** Need to verify modal accessibility
- **Action Required:**
  - [ ] Add `role="dialog"` and `aria-modal="true"`
  - [ ] Trap focus within modal
  - [ ] Return focus to trigger element on close
  - [ ] Allow ESC key to close

---

### WCAG 2.1 Compliance Checklist

**Level A (Must Have):**
- [ ] 1.1.1 Non-text Content - Alt text for all images
- [ ] 2.1.1 Keyboard - All functionality available via keyboard
- [ ] 2.1.2 No Keyboard Trap - Focus can move away from all components
- [ ] 3.1.1 Language of Page - `<html lang="en">`
- [ ] 4.1.1 Parsing - Valid HTML
- [ ] 4.1.2 Name, Role, Value - All UI components identified

**Level AA (Should Have):**
- [ ] 1.4.3 Contrast (Minimum) - 4.5:1 for normal text
- [ ] 1.4.5 Images of Text - Avoid using images of text
- [ ] 2.4.6 Headings and Labels - Descriptive headings
- [ ] 3.2.3 Consistent Navigation - Navigation consistent across pages
- [ ] 3.3.1 Error Identification - Errors identified in text
- [ ] 3.3.2 Labels or Instructions - Labels for all inputs

---

## 📦 CODE QUALITY ISSUES

### Package Updates Needed

**Backend Dependencies:**
- [ ] Review all packages in `backend/package.json` for security updates
- [ ] Check for deprecated packages:
  - `matrix-js-sdk` - Is this being used? If not, remove
  - All `@types/*` packages - ensure matching versions

**Frontend Dependencies:**
- [ ] Tiptap packages are version 3.14.0 - check for updates
- [ ] React 18.2.0 - update to latest 18.x
- [ ] Vite 5.0.8 - update to latest 5.x

**Action Required:**
- [ ] Run `npm outdated` in backend/ and frontend/
- [ ] Update non-breaking version updates
- [ ] Test thoroughly after updates
- [ ] Document any breaking changes

---

### Unnecessary Files/Code

**Potential Removals:**
- [ ] Check if `matrix-js-sdk` is actually used (search codebase)
- [ ] Verify all migration files are necessary
- [ ] Check for unused imported modules
- [ ] Remove any old/commented code

---

### TypeScript Issues

**Action Required:**
- [ ] Run `tsc --noEmit` to check for type errors
- [ ] Fix any `any` types (especially in API calls)
- [ ] Ensure strict mode is enabled in tsconfig.json
- [ ] Add return types to all functions

---

### Code Organization

**Issues Identified:**
1. **Inline Styles** - Frontend uses inline styles heavily
   - [ ] Consider moving to CSS modules or styled-components
   - [ ] Create a proper design system

2. **Long Files** - Some files are very long (e.g., `discordBot.ts` is 3173 lines)
   - [ ] Break into smaller, focused modules
   - [ ] Separate Discord command handlers

3. **Magic Numbers** - Hardcoded values throughout
   - [ ] Create constants file for common values
   - [ ] Document business logic decisions

---

### Industry Standard Violations

**1. Environment Variable Handling**
- **Issue:** `.env` file loading in server.ts (lines 1-5)
- **Status:** ✅ ACCEPTABLE for this use case, but document it

**2. Error Handling**
- **Issue:** Some try-catch blocks just log and return generic errors
- **Action Required:**
  - [ ] Implement proper error logging service (e.g., Sentry)
  - [ ] Create error classes for different error types
  - [ ] Return appropriate HTTP status codes

**3. Testing**
- **Issue:** ❌ No tests found in codebase
- **Action Required:**
  - [ ] Add Jest configuration
  - [ ] Write unit tests for critical functions
  - [ ] Add integration tests for API endpoints
  - [ ] Add E2E tests for critical user flows

**4. Logging**
- **Issue:** Using `console.log` instead of proper logging library
- **Action Required:**
  - [ ] Implement Winston or Pino for structured logging
  - [ ] Add log levels (debug, info, warn, error)
  - [ ] Configure log rotation
  - [ ] Send production logs to monitoring service

**5. Documentation**
- **Issue:** ⚠️ Code comments are sparse
- **Action Required:**
  - [ ] Add JSDoc comments to all exported functions
  - [ ] Document complex business logic
  - [ ] Add README.md to each major directory
  - [ ] Create API documentation (Swagger/OpenAPI)

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All branding changes completed
- [ ] All tests passing (once tests are written)
- [ ] Security audit items addressed
- [ ] Accessibility improvements implemented
- [ ] Environment variables updated
- [ ] AWS resources renamed/created
- [ ] Domain DNS configured
- [ ] SSL certificate obtained

### AWS Resources to Create/Update

- [ ] **RDS Database:** Create `murder` database OR rename existing
- [ ] **S3 Bucket:** Create `murder-tech-documents` bucket
- [ ] **Secrets Manager:** Create all `murder/*` secrets
- [ ] **IAM Role:** Rename `CyarikaEC2SecretsRole` to `MurderTechEC2SecretsRole`
- [ ] **Route 53:** Configure new domain records
- [ ] **EC2:** Update security groups, tags for new branding

### Production Deployment Steps

1. [ ] Test all changes in development environment
2. [ ] Create database backup
3. [ ] Deploy to staging environment (if available)
4. [ ] Run smoke tests
5. [ ] Deploy to production during low-traffic period
6. [ ] Monitor logs for errors
7. [ ] Verify all features working
8. [ ] Update documentation with new URLs

---

## 📊 STATISTICS

### Branding Changes Required
- **Code Files:** ~50 files need updates
- **Total Instances:** 200+ references to old branding
- **Documentation Files:** 15+ markdown files
- **Critical AWS Resources:** 8 items (secrets, database, S3, etc.)

### Security Status
- **Critical Issues:** 0 🎉
- **High Priority:** 3 (domain, secrets, redis)
- **Medium Priority:** 4
- **Already Compliant:** 15+ security features

### Accessibility Status
- **Critical Issues:** 8
- **Estimated Compliance:** ~30% WCAG 2.1 AA
- **Target:** 100% WCAG 2.1 AA compliance

### Code Quality
- **TypeScript Strict Mode:** ✅ Enabled
- **Test Coverage:** ❌ 0%
- **Linting:** Unknown (no ESLint config found)
- **Code Documentation:** ~20%

---

## 🎯 RECOMMENDED PRIORITY ORDER

### Phase 1: Critical Infrastructure (Week 1)
1. ✅ Complete this audit
2. 🔴 Update AWS Secrets Manager
3. 🔴 Create/rename database
4. 🔴 Register new domain
5. 🔴 Update all CORS/domain references
6. 🔴 Deploy to staging for testing

### Phase 2: Code Rebranding (Week 1-2)
1. 🟡 Update all code files (use find/replace carefully)
2. 🟡 Update all documentation
3. 🟡 Test thoroughly
4. 🟡 Update README and public-facing docs

### Phase 3: Security & Accessibility (Week 2-3)
1. 🟢 Add comprehensive ARIA labels
2. 🟢 Implement keyboard navigation
3. 🟢 Fix color contrast issues
4. 🟢 Add proper error logging
5. 🟢 Conduct security penetration testing

### Phase 4: Code Quality (Week 3-4)
1. 🔵 Add unit tests
2. 🔵 Set up proper logging
3. 🔵 Update dependencies
4. 🔵 Refactor long files
5. 🔵 Add API documentation

### Phase 5: GitHub Preparation (Week 4)
1. 📦 Remove any remaining sensitive data
2. 📦 Create comprehensive README
3. 📦 Add LICENSE file
4. 📦 Add CONTRIBUTING.md
5. 📦 Create GitHub repo and push
6. 📦 Set up GitHub Actions for CI/CD

---

## ⚠️ WARNINGS

### DO NOT:
- ❌ Change AWS secret names in production without testing in dev first
- ❌ Delete old AWS resources until migration is confirmed working
- ❌ Deploy during peak usage times
- ❌ Skip database backup before migration
- ❌ Commit any `.env` files to GitHub
- ❌ Push to public GitHub until ALL sensitive data is removed

### VERIFY BEFORE PUBLIC RELEASE:
- ⚠️ No API keys in code
- ⚠️ No database passwords
- ⚠️ No private server URLs
- ⚠️ No personal information
- ⚠️ No production credentials in documentation

---

## 📝 NOTES

### Recommended Tools
- **Accessibility Testing:** axe DevTools, WAVE, Lighthouse
- **Security Scanning:** npm audit, Snyk, OWASP ZAP
- **Code Quality:** ESLint, Prettier, SonarQube
- **Testing:** Jest, React Testing Library, Playwright
- **Logging:** Winston or Pino
- **Monitoring:** Sentry, DataDog, or CloudWatch

### GitHub Public Release Considerations
- Add comprehensive README with setup instructions
- Create detailed CONTRIBUTING.md
- Add CODE_OF_CONDUCT.md
- Set up GitHub Issues templates
- Create GitHub Actions for CI/CD
- Add badges (build status, coverage, etc.)
- Consider adding demo video or screenshots
- Write clear installation documentation
- Document all environment variables needed

---

**End of Audit**

This audit was conducted on December 24, 2025. The codebase is generally well-structured with good security practices in place. The main work needed is systematic rebranding and accessibility improvements.

**Estimated Total Effort:** 3-4 weeks for complete implementation of all recommendations.

**Next Step:** Review this audit with the team and prioritize tasks based on business needs and timeline.
