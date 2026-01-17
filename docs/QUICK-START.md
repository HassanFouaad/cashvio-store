# Quick Start Guide

Get your StoreFront up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 24+ installed
- ✅ Yarn package manager
- ✅ Backend API running (default: `http://localhost:3001`)

## Step 1: Install Dependencies

```bash
cd store-front
yarn install
```

## Step 2: Configure Environment

The `.env.local` file should already exist with default values. If not, create it:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Important**: Update the URL if your backend runs on a different port.

## Step 3: Start Development Server

```bash
yarn dev
```

The app will start on `http://localhost:3000`

## Step 4: Test the Application

### Option 1: Visit Landing Page
Open your browser to:
```
http://localhost:3000
```

You'll see a welcome page with example store links.

### Option 2: Direct Store Access
Access a store directly using the path format:
```
http://localhost:3000/store/{STORE_CODE}
```

Example:
```
http://localhost:3000/store/ABC123
```

Replace `ABC123` with an actual store code from your backend.

## What You Should See

### ✅ If Store Exists and is Active:
- Store header with logo and navigation
- Hero carousel (if images configured)
- Welcome section
- Features section
- Store footer with social links

### ⚠️ If Store Not Found:
- "Store Not Found" error page
- Option to try again or go home

### ⚠️ If Store is Inactive:
- "Store Unavailable" message
- Information about inactive status

### ❌ If Backend is Down:
- "Connection Error" message
- Option to retry

## Common Issues & Solutions

### Issue: "Connection Error"
**Cause**: Backend API is not running or wrong URL

**Solution**:
1. Check backend is running: `http://localhost:3001/api/v1/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS settings on backend

### Issue: "Store Not Found"
**Cause**: Store code doesn't exist in database

**Solution**:
1. Verify store code is correct
2. Check store exists in backend database
3. Try with a known store code

### Issue: Page Won't Load
**Cause**: Port 3000 is already in use

**Solution**:
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use a different port
yarn dev -p 3001
```

### Issue: TypeScript Errors
**Cause**: Missing dependencies or configuration

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules
yarn install

# Check TypeScript
yarn tsc --noEmit
```

## Development Workflow

### 1. Make Changes
Edit files in `src/` directory

### 2. See Changes Instantly
Next.js will auto-reload (Hot Module Replacement)

### 3. Check for Errors
- Browser console (F12)
- Terminal output
- TypeScript errors in IDE

### 4. Build for Production
```bash
yarn build
```

### 5. Test Production Build
```bash
yarn start
```

## Project Structure Overview

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── page.tsx           # Landing page (/)
│   └── store/[code]/      # Store pages (/store/ABC123)
│
├── features/              # Feature modules
│   └── store/            # Store feature
│       ├── api/          # API calls
│       ├── components/   # Store components
│       ├── types/        # TypeScript types
│       └── utils/        # Utilities
│
├── lib/                   # Shared utilities
│   ├── api/              # API client
│   ├── utils/            # Helper functions
│   └── constants.ts      # Constants
│
├── components/            # Shared UI components
│   └── ui/               # shadcn/ui components
│
└── providers/             # React providers
    └── query-provider.tsx # React Query
```

## Key Commands

```bash
# Development
yarn dev              # Start dev server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run linter
yarn tsc --noEmit     # Check TypeScript

# Add UI Components (shadcn/ui)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

## Testing Checklist

Before considering your setup complete:

- [ ] Landing page loads (`http://localhost:3000`)
- [ ] Can access store page (`/store/{CODE}`)
- [ ] Store header displays correctly
- [ ] Store footer displays correctly
- [ ] Hero images load (if configured)
- [ ] Error page shows for invalid store code
- [ ] No console errors in browser
- [ ] Backend API is responding

## Next Steps

Once everything is working:

1. **Read Documentation**:
   - `README.md` - Architecture overview
   - `DEVELOPMENT.md` - How to add features
   - `IMPLEMENTATION-SUMMARY.md` - What's been built

2. **Explore the Code**:
   - Start with `src/app/store/[code]/page.tsx`
   - Review `src/features/store/api/get-store.ts`
   - Check `src/lib/api/client.ts`

3. **Make Your First Change**:
   - Edit `src/app/store/[code]/page.tsx`
   - Change the welcome message
   - See it update instantly!

4. **Add a New Feature**:
   - Follow patterns in `DEVELOPMENT.md`
   - Use existing code as reference
   - Maintain type safety

## Getting Help

- **Documentation**: Check README.md and DEVELOPMENT.md
- **Code Examples**: Review existing components
- **Console Errors**: Check browser console (F12)
- **Network Issues**: Check Network tab in DevTools
- **TypeScript Errors**: Hover over red squiggles in IDE

## Production Deployment

When ready to deploy:

1. **Build the app**:
```bash
yarn build
```

2. **Test production build locally**:
```bash
yarn start
```

3. **Set environment variables** in your hosting platform:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
```

4. **Deploy** to your platform (Vercel, Netlify, etc.)

## Success!

If you can see the landing page and access a store page, you're all set! 🎉

Start building amazing features on this solid foundation.

---

**Need more details?** Check out:
- `README.md` - Full documentation
- `DEVELOPMENT.md` - Development guide
- `IMPLEMENTATION-SUMMARY.md` - What's been implemented
