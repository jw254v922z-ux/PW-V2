# Replit Migration Task List

## Phase 1: Install Missing Dependencies
- [ ] Install pnpm globally
- [ ] Install project dependencies with `pnpm install`
- [ ] Verify tsx is installed
- [ ] Check Node.js version compatibility

## Phase 2: Migrate Database from MySQL to PostgreSQL
- [ ] Update drizzle.config.ts to use PostgreSQL driver
- [ ] Update database schema for PostgreSQL compatibility
- [ ] Update connection string format
- [ ] Generate new migrations for PostgreSQL
- [ ] Test database connection

## Phase 3: Configure Replit Environment Variables
- [ ] Set DATABASE_URL for PostgreSQL
- [ ] Set JWT_SECRET
- [ ] Set OAuth environment variables
- [ ] Set Manus API credentials
- [ ] Verify .env.local is properly configured

## Phase 4: Test Build and Dev Server
- [ ] Run `pnpm run dev` to start dev server
- [ ] Verify no build errors
- [ ] Check server is listening on correct port
- [ ] Test Vite HMR (hot module replacement)

## Phase 5: Verify All Features Working
- [ ] Test calculator functionality
- [ ] Test map drawing feature
- [ ] Test PDF export
- [ ] Test CSV export
- [ ] Verify all stakeholder metrics display correctly
