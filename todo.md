# Private Wire Solar Calculator - TODO

## Current Work - User Requirements

### Phase 1: UI Enhancements and Disclaimers
- [x] Add total CAPEX display at top of page
- [x] Add disclaimer banner explaining tool limitations, validity date, and data sources
- [x] Move disclaimer to top of page as single-line banner
- [x] Add "View full details" link to disclaimer
- [ ] Preserve private wire parameters when switching between tabs
- [ ] Show info icons (ⓘ) for grid costs and researched costs with source links

### Phase 2: Authentication and Access Control
- [x] Add no-login option (read-only mode, no save functionality)
- [x] Update login flow to allow guest access
- [x] Disable save/update buttons for guest users

### Phase 3: Financial Model Fixes and Calculations
- [x] Fix irradiance override to actually affect revenue calculations
- [x] Add annual savings calculation based on "Offsetable energy cost" counter-factual
- [x] Add offsetable energy cost input field with note about energy pricing tool
- [x] Add offsetable energy cost to database schema
- [ ] Remove ability to discount CAPEX (all CAPEX is Year 0) - already correct
- [ ] Account for road cable laying costs (traffic management, trenching, reinstatement)

### Phase 4: Grid Cost Management and Overrides
- [x] Add ability to override ALL grid cost assumptions
- [x] Create override UI for grid connection costs
- [ ] Fix info icons to show sources for all researched costs (cable, transformer, wayleave)
- [x] Store override values in session/model

### Phase 5: Sensitivity Analysis and Reporting
- [x] Add LCOE sensitivity heatmap (cable voltage vs distance)
- [x] Show cash flow table for entire project lifespan on Cash Flow tab
- [x] Include discounted cash flow column in table
- [x] Create summary report download with all sources and assumptions
- [x] Export report as PDF with cost breakdowns and disclaimers
- [x] Fix offsetable energy cost to affect annual savings calculation
- [x] Add CPI escalation to offsetable energy cost (field added, ready for UI)
- [ ] Add IRR sensitivity analysis (showing how IRR changes with cable voltage/distance)
- [ ] Ensure current scenario in sensitivity analysis matches Private Wire Parameters tab

### Phase 6: Data Upload and Profile Management
- [ ] Add ability to upload HH (half-hourly) profile for demand
- [ ] Add ability to upload HH profile for generation
- [ ] Parse and validate uploaded profiles
- [ ] Update calculations to use uploaded profiles instead of annual averages

### Phase 7: Final Testing and Checkpoint
- [ ] Run comprehensive test suite
- [ ] Verify all features work end-to-end
- [ ] Test with and without login
- [ ] Test report generation and downloads
- [ ] Save final checkpoint and publish

## Completed Features (Previous Phases)

### Phase 1: Wayleave & Land Costs
- [x] Show wayleave cost units (£/km/year) in grid connection tab
- [x] Add wayleave discount percentage option
- [x] Add wayleave CPI inflation option
- [x] Add road cable laying costs (similar to wayleave structure)

### Phase 2: CAPEX/OPEX Calculations
- [x] Fix CAPEX to include: Dev Premium + EPC Cost + Private Wire Cost (already correct)
- [x] Fix OPEX to deduct from cash flow each year (already correct)
- [x] Verify financial model calculations against Excel (LCOE now matches exactly)

### Phase 3 & 4: Dev Premium + Land Option + Degradation Labels
- [x] Add checkbox to enable/disable Developer Premium (upfront CAPEX)
- [x] Add checkbox to enable/disable Land Option Yearly Cost (recurring OPEX)
- [x] Add discount percentage slider for Developer Premium
- [x] Add discount percentage slider for Land Option Cost
- [x] Add CPI inflation rate for both options
- [x] Update CAPEX calculation to include Developer Premium when enabled
- [x] Update OPEX calculation to include Land Option Cost when enabled
- [x] Rename Degradation label to Panel Degradation (%)
- [x] Add Irradiance Override (kWh/m²/year) input field
- [x] Update generation calculation to use custom irradiance if provided (field added, awaiting implementation)


### Phase 8: Landing Page Reorganization and Landowner Page
- [x] Rename section heading to "Project Details" (keeping Total CAPEX, LCOE, IRR, Payback Period, Total NPV)
- [x] Remove Annual Savings from Project Details section
- [x] Create new "Offtaker" section with Annual Savings metric card
- [x] Create new "Landowner" section with Total Yearly Land Options Income and Land Option Yield metric cards
- [x] Keep "Landowner" tab in tabs area for detailed analysis
- [x] Verify three separate metric sections display correctly on landing page


### Phase 9: Land Option Calculation Fix
- [x] Enable land option by default in calculator (£5,000/MW/year)
- [x] Verify land option is properly included in OPEX calculation
- [x] Test land option metrics calculate correctly (Total Yearly Land Options Income and Land Option Yield)


### Phase 10: Land Rental Terminology Update
- [x] Rename "Land Option Cost" to "Land Rental Cost" in parameters
- [x] Rename "Land Option Income" to "Land Rental Income" in metrics
- [x] Rename "Land Option Yield" to "Land Rental Yield" in metrics
- [x] Update checkbox label to "Include Land Rental Cost in OPEX"


### Phase 11: Offtaker and Landowner Metric Updates
- [x] Add yearly savings and total savings calculations to calculator
- [x] Add yearly rental income calculation to calculator
- [x] Update Offtaker banner to show Yearly Savings and Total Savings
- [x] Update Landowner banner to show Yearly Rental Income and Total Rental Income


### Phase 12: Landowner Yield and Stakeholder Value Distribution
- [x] Add Land Rental Yield metric back to Landowner banner (3 metrics total)
- [x] Create stakeholder value distribution chart showing proportional value
- [x] Calculate proportional values: Project NPV, Offtaker Savings, Landowner Income
- [x] Display chart on landing page below metric banners
- [x] Test chart updates dynamically with parameter changes


### Phase 13: Fix Negative Value Handling in Stakeholder Chart
- [x] Update StakeholderValueChart to show 0 for negative Project NPV values
- [x] Test chart displays correctly when NPV is negative


### Phase 14: Fix PPA Price Naming and Savings Calculation
- [x] Rename "Power Price" to "PPA Price" in Dashboard UI
- [x] Update calculator to use correct savings formula (max(0, avoided_cost - PPA_price) * energy)
- [x] Test savings = 0 when PPA Price equals Offsetable Energy Cost
- [x] Test savings > 0 when PPA Price < Offsetable Energy Cost


### Phase 15: Remove Landowner Tab and Disable Login
- [x] Remove "Landowner" tab from white banner tabs section
- [x] Disable authentication requirement for public access
- [x] Keep login functionality in code for future use
- [x] Test page loads without login screen


### Phase 16: Developer Stakeholder and Centralized Chart
- [x] Add Developer Premium calculation to summary
- [x] Create Developer banner section with Developer Premium metric
- [x] Update StakeholderValueChart to include Developer stakeholder
- [x] Add toggle to show/hide stakeholder split pie chart
- [x] Centralize pie chart on landing page
- [x] Test all stakeholder metrics display correctly
- [ ] Save checkpoint and push to GitHub


### Phase 17: Land Value Input and Rental Yield Calculation
- [x] Add Land Value number input field to parameters panel
- [x] Update Land Rental Yield calculation to use Land Value instead of CAPEX
- [x] Update PDF export to include all stakeholder metrics (Project Details, Offtaker, Landowner, Developer)
- [x] Test Land Value input updates Land Rental Yield correctly
- [x] Test PDF export includes all four stakeholder sections
- [x] Save checkpoint and push to GitHub

### Phase 18: Replit Deployment Fixes
- [x] Fix getLoginUrl() error handling with try-catch
- [x] Fix useAuth hook to defer getLoginUrl() call to useMemo
- [x] Fix .replit port configuration (3000 instead of 5000)
- [x] Verify application loads without errors on Replit
- [x] Confirm all stakeholder metrics display correctly
- [ ] Save checkpoint and push fixes to GitHub


## Phase 19: Interactive Map Feature (Incremental Build)

### Phase 1: Map Integration & Basic Display
- [x] Create MapView page component with Google Maps integration
- [x] Display map centered on UK (default location)
- [x] Add map controls (zoom, pan, satellite/street view toggle)
- [x] Create sidebar panel for map controls and results
- [x] Checkpoint 1: Basic map displays correctly

### Phase 2: Drawing Tools (Polygon & Polyline) - ENHANCED
- [x] Implement polygon drawing tool for PV area
- [x] Implement polyline drawing tool for cable route
- [x] Add click listeners to map for drawing points
- [x] Render drawn shapes as proper polygons/polylines with visual lines
- [x] Add undo/delete last point functionality
- [x] Checkpoint 2: Can draw PV polygon and cable polyline with visual lines

### Phase 3: Geospatial Calculations (Distance & Area)
- [x] Calculate polygon area (PV size in m²/hectares)
- [x] Calculate polyline distance (cable length in km)
- [x] Display results in real-time as user draws
- [x] Add geospatial utility functions
- [x] Checkpoint 3: Area and distance calculations working

### Phase 4: Auto-populate Parameters from Map
- [x] Convert PV area to system size using industry standard (0.5 MW/hectare)
- [x] Display Estimated System Size (MW) in PV Area results
- [x] Display Cable Distance (km) in Cable Route results  
- [x] Add "Apply to Calculator" buttons for both PV and cable
- [ ] Implement button click handlers to auto-populate parameters
- [ ] Show "From Map" badge on auto-populated fields
- [ ] Allow manual override with clear indication
- [ ] Checkpoint 4: Parameters auto-populate from map drawings

### Phase 5: Data Persistence & Integration
- [ ] Save map drawings (PV area, cable route) to database
- [ ] Link map data to existing calculator parameters
- [ ] Auto-populate cable distance and voltage from map
- [ ] Allow loading/editing saved map data
- [ ] Checkpoint 5: Data persists and integrates with calculator

### Phase 6: UI/UX Polish & Testing
- [ ] Add help/tutorial tooltips
- [ ] Implement responsive design for mobile
- [ ] Add export map as image/PDF
- [ ] Test with various PV sizes and cable routes
- [ ] Performance optimization
- [ ] Checkpoint 6: Feature complete and polished


## Phase 20: Static Webpage Export
- [ ] Create static build configuration (vite.config for SPA)
- [ ] Remove backend/tRPC dependencies from frontend
- [ ] Remove authentication layer
- [ ] Convert to client-only calculations
- [ ] Build and test static export
- [ ] Deploy to GitHub Pages


## Phase 22: Replace Google Maps with Leaflet
- [x] Install Leaflet dependencies (leaflet, react-leaflet, @types/leaflet)
- [x] Create LeafletMap component with OpenStreetMap tiles
- [x] Rewrite MapView page to use Leaflet instead of Google Maps
- [x] Implement polygon drawing for PV areas with Leaflet
- [x] Implement polyline drawing for cable routes with Leaflet
- [x] Add real-time area and distance calculations
- [ ] Test map drawing functionality on Replit
- [ ] Save checkpoint and push to GitHub


## Phase 23: PDF Export Enhancements
- [x] Add map view screenshot (PV area and private wire) to PDF export
- [x] Standardize stakeholder title font sizes in PDF (consistent sizing)
- [x] Add full project cash flow table on yearly basis to PDF
- [x] Implement map capture functionality for PDF inclusion
- [ ] Test PDF export with all new features
- [ ] Save checkpoint and push to GitHub


## Phase 24: Replit Hosting Configuration
- [x] Update environment variables for Replit compatibility
- [x] Verify all required dependencies are installed
- [x] Update cookies.ts for Replit iframe authentication (sameSite: "none", secure: true)
- [x] Fix analytics script in HTML (comment out or use placeholder)
- [x] Create .replit configuration file with npm dev command
- [ ] Test deployment on Replit
- [ ] Save checkpoint and push to GitHub


## Phase 25: Custom Authentication & Project Management System

### Phase 1: Database Schema & Auth Backend
- [x] Add `users` table (id, email, passwordHash, emailVerified, createdAt, updatedAt)
- [x] Add `email_verification_tokens` table (id, userId, token, expiresAt)
- [x] Add `password_reset_tokens` table (id, userId, token, expiresAt)
- [x] Add `domain_whitelist` table (id, domain, createdAt)
- [x] Add `projects` table (id, userId, name, description, inputs JSON, results JSON, createdAt, updatedAt)
- [x] Add `project_drawings` table (id, projectId, type, url, createdAt)
- [x] Create database migrations with `pnpm db:push`

### Phase 2: Authentication Backend (tRPC Procedures)
- [x] Create auth utility functions (hashPassword, verifyPassword, generateToken, createSessionToken)
- [x] Create auth database helpers (findUserByEmail, createUser, markEmailAsVerified, etc.)
- [x] Install bcrypt and jose packages
- [x] Integrate auth procedures into main routers.ts
- [x] Implement `auth.signup(email, password)` with email validation
- [x] Implement `auth.login(email, password)` with password verification
- [x] Implement `auth.logout()` to clear session
- [x] Implement `auth.me()` to get current user
- [x] Implement `auth.requestPasswordReset(email)` with token generation
- [x] Implement `auth.resetPassword(token, newPassword)` with token validation
- [x] Implement `auth.verifyEmail(token)` for email confirmation
- [x] Create vitest tests for auth utilities (all 10 tests passing)
- [ ] Add rate limiting for login attempts (prevent brute force)
- [ ] Add domain whitelist validation in signup

### Phase 3: Authentication UI
- [x] Create Login page component with email/password form
- [x] Create Signup page component with email/password/confirm password
- [x] Create Password Reset Request page (enter email)
- [x] Create Password Reset page (enter new password with token)
- [x] Create Email Verification page (confirm email link)
- [x] Add auth routes to App.tsx
- [x] Add success/error toast notifications for auth flows
- [ ] Add auth guard to redirect unauthenticated users to login
- [ ] Test all auth flows end-to-end

### Phase 4: Project Management Backend
- [x] Implement `projects.create(name, description, inputs, results)`
- [x] Implement `projects.list()` to get all user projects
- [x] Implement `projects.get(projectId)` to load full project
- [x] Implement `projects.update(projectId, name, description, inputs, results)`
- [x] Implement `projects.delete(projectId)` with cascade delete
- [x] Implement `projects.duplicate(projectId)` to clone project
- [ ] Implement `drawings.upload(projectId, file, type)` with S3 upload
- [ ] Implement `drawings.list(projectId)` to get project drawings
- [ ] Implement `drawings.delete(drawingId)` to remove from S3
- [x] Add user authorization checks (users can only access own projects)

### Phase 5: Project Management UI - Dashboard
- [x] Create Projects Dashboard page (/projects route)
- [x] Create project list with timestamps
- [x] Create "Create New Project" form
- [x] Create "Load Project" button
- [x] Create "Delete Project" button with confirmation
- [x] Create "Duplicate Project" dialog
- [x] Show success/error toasts for operations
- [ ] Update Dashboard to show "Save Project" button
- [ ] Implement save functionality (call projects.create)
- [ ] Implement load functionality (call projects.get and populate calculator)

### Phase 6: User Dashboard Page
- [ ] Create `/dashboard` page component
- [ ] Create project list table (Name, Description, Created, Modified, Actions)
- [ ] Implement search/filter by project name
- [ ] Implement sort by date and name
- [ ] Add pagination (20 projects per page)
- [ ] Implement project actions: View, Edit, Duplicate, Delete, Export
- [ ] Create project details modal (preview, metrics, drawings)
- [ ] Add bulk delete functionality
- [ ] Test dashboard loads and displays projects correctly

### Phase 7: User Settings Page
- [ ] Create `/settings` page component
- [ ] Add Change Email section with verification
- [ ] Add Change Password section with old password verification
- [ ] Add Delete Account section with confirmation
- [ ] Implement email change with re-verification flow
- [ ] Implement password change with validation
- [ ] Implement account deletion with all data cleanup
- [ ] Add success/error notifications for all operations

### Phase 8: Admin Page - Domain Whitelist
- [ ] Create `/admin` page component (admin-only access)
- [ ] Add domain whitelist management UI
- [ ] Implement add domain functionality
- [ ] Implement remove domain functionality
- [ ] Create domain list table with add/remove buttons
- [ ] Add validation for domain format (@example.com)
- [ ] Implement admin authorization check
- [ ] Test admin page access control

### Phase 9: Integration & Testing
- [ ] Test signup with email verification flow
- [ ] Test login with valid/invalid credentials
- [ ] Test password reset flow
- [ ] Test domain whitelist enforcement
- [ ] Test project save/load/delete
- [ ] Test project list and search
- [ ] Test user settings (email, password, account deletion)
- [ ] Test admin domain whitelist management
- [ ] Test all error cases and edge cases
- [ ] Verify email notifications send correctly

### Phase 10: Deployment & Checkpoint
- [ ] Remove Manus OAuth from app (replace with custom auth)
- [ ] Update App.tsx to use custom auth instead of useAuth hook
- [ ] Update navigation to show login/logout based on auth state
- [ ] Test full application end-to-end
- [ ] Save checkpoint with complete auth system
- [ ] Document authentication flow for future reference


## Phase 26: PDF Brand Redesign (Savills Earth)
- [ ] Redesign PDF with Savills Earth yellow/green color scheme
- [ ] Add yellow highlight boxes for key metrics (LCOE, IRR, NPV)
- [ ] Add green accent bar on right side of pages
- [ ] Update pie chart colors to match brand (green, lime green, gray)
- [ ] Create color-coded stakeholder sections (Offtaker=blue, Landowner=teal, Developer=slate)
- [ ] Format headings with bold sans-serif typography
- [ ] Add professional footer with "SAVILLS EARTH 2026" and page numbers
- [ ] Improve layout spacing and white space for professional appearance
- [ ] Test PDF generation and verify brand consistency
