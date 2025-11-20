# Customer Loyalty Portal - Complete To-Do List

## 🎯 Project Overview

**Goal:** Build a production-ready customer loyalty portal where clients can view points, manage bookings, refer friends, and redeem rewards.

**Timeline:** 8-10 weeks (aggressive) | 12-14 weeks (comfortable)

**Current Status:** ✅ Auth system designed, Schema ready, Mock data available

---

## 📋 PHASE 1: Foundation & Authentication (Weeks 1-2)

### ✅ 1.1 Project Setup
- [x] Initialize Next.js 14 project with App Router
- [x] Install dependencies (Supabase, Shadcn/ui, etc.)
- [x] Configure Tailwind CSS
- [x] Set up environment variables
- [x] Configure TypeScript strict mode

### ✅ 1.2 Database Setup
- [x] Deploy loyalty schema to Supabase
- [x] Insert mock data for testing
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database indexes
- [ ] Test all database functions

### ✅ 1.3 Authentication Implementation
- [ ] Implement Supabase client (browser + server)
- [ ] Create middleware for route protection
- [ ] Build auth callback handler
- [ ] Create signup form with referral code support
- [ ] Create login form
- [ ] Create password reset flow
- [ ] Add email verification
- [ ] Test auth flow end-to-end

### ✅ 1.4 Base Layout & Navigation
- [ ] Create protected layout wrapper
- [ ] Build mobile bottom navigation
- [ ] Build desktop top navigation
- [ ] Create user menu dropdown
- [ ] Add notifications bell (UI only for now)
- [ ] Test responsive behavior (375px to 1440px)

**Deliverable:** Working auth system with mobile/desktop navigation

---

## 📋 PHASE 2: Dashboard & Points Pages (Weeks 3-4)

### 🏠 2.1 Dashboard Page (/)
- [ ] Create dashboard page layout
- [ ] Build points balance card component
- [ ] Build quick stats grid component
- [ ] Build recent activity list component
- [ ] Build upcoming trips preview component
- [ ] Build quick actions CTAs
- [ ] Fetch client data from Supabase
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Test on mobile & desktop

### 💰 2.2 Points Overview (/points)
- [ ] Create points overview page layout
- [ ] Build main points balance card
- [ ] Build lifetime stats grid
- [ ] Build earn explainer card
- [ ] Build redeem explainer card
- [ ] Build quick actions section
- [ ] Fetch points data from Supabase
- [ ] Calculate available discount (use function)
- [ ] Add loading states
- [ ] Test responsive layout

### 📜 2.3 Points Statement (/points/statement)
- [ ] Create statement page layout
- [ ] Build transaction list component
- [ ] Build transaction item card with icons
- [ ] Build filter controls (All/Earned/Spent)
- [ ] Build sort controls (Latest/Oldest)
- [ ] Add month dividers
- [ ] Implement pagination or infinite scroll
- [ ] Fetch transactions from Supabase
- [ ] Add empty state (no transactions)
- [ ] Test filtering & sorting

### 📚 2.4 How to Earn Page (/points/earn)
- [ ] Create earn guide page layout
- [ ] Build earning rate explainer card
- [ ] Build 3 earning methods cards
- [ ] Build interactive points calculator
- [ ] Add calculator logic (amount → points)
- [ ] Fetch loyalty settings from Supabase
- [ ] Display personal earning stats
- [ ] Test calculator with various amounts

### 🎁 2.5 How to Redeem Page (/points/redeem)
- [ ] Create redeem guide page layout
- [ ] Build redemption rate explainer card
- [ ] Build available discount card
- [ ] Build 3-step redemption process
- [ ] Build interactive redemption calculator
- [ ] Add slider for points selection
- [ ] Show discount breakdown
- [ ] Display redemption rules
- [ ] Test calculator with edge cases

**Deliverable:** Complete Points section with all 4 pages working

---

## 📋 PHASE 3: Trips Management (Weeks 5-6)

### ✈️ 3.1 Trips Hub (/trips)
- [ ] Create trips hub page with tabs
- [ ] Build tab navigation (Upcoming/Past/Cancelled)
- [ ] Build trip card component
- [ ] Implement tab switching logic
- [ ] Fetch bookings from bookings_cache
- [ ] Filter by status and date
- [ ] Add empty states for each tab
- [ ] Test tab switching

### 📅 3.2 Trip Details Page (/trips/[bookingId])
- [ ] Create trip details page layout
- [ ] Display event details section
- [ ] Display booking details section
- [ ] Display payment summary section
- [ ] Display loyalty points section
- [ ] Add "Add to Calendar" button (.ics download)
- [ ] Add "Contact Support" link
- [ ] Fetch booking details from Supabase
- [ ] Handle non-existent booking IDs
- [ ] Test with various booking statuses

### 🔄 3.3 Trips Filtering & Sorting
- [ ] Add date range filter
- [ ] Add event type filter (if applicable)
- [ ] Add sort options (date, amount)
- [ ] Implement search by booking reference
- [ ] Add "Upcoming trips first" logic
- [ ] Test all filter combinations

**Deliverable:** Complete Trips section with detail pages

---

## 📋 PHASE 4: Referral Program (Week 7)

### 🎁 4.1 Referral Hub (/refer)
- [ ] Create referral hub page layout
- [ ] Build "Give £100, Get £100" hero card
- [ ] Build "How It Works" section (3 steps)
- [ ] Build referral link generator
- [ ] Implement copy-to-clipboard functionality
- [ ] Build share buttons (Email, WhatsApp, SMS)
- [ ] Build referrals stats summary card
- [ ] Fetch referral settings from Supabase
- [ ] Generate unique referral code (if none exists)
- [ ] Test share functionality on mobile

### 📊 4.2 My Referrals Page (/refer/my-referrals)
- [ ] Create my referrals page layout
- [ ] Build status breakdown (Pending/Signed Up/Completed)
- [ ] Build referral list component
- [ ] Build referral list item card
- [ ] Show status badges (color-coded)
- [ ] Display points earned per referral
- [ ] Fetch referrals from Supabase
- [ ] Add "Resend invitation" option
- [ ] Add empty state (no referrals)
- [ ] Test with various referral statuses

### 📝 4.3 Referral Terms Page (/refer/terms)
- [ ] Create referral terms page
- [ ] Write clear terms & conditions
- [ ] Add FAQs section
- [ ] Link from referral hub
- [ ] Make mobile-friendly

**Deliverable:** Complete Referral system

---

## 📋 PHASE 5: Profile & Settings (Week 8)

### 👤 5.1 Profile Overview (/profile)
- [ ] Create profile page layout
- [ ] Display personal info section
- [ ] Display membership status card
- [ ] Display points summary
- [ ] Build settings menu
- [ ] Build support links
- [ ] Add logout button
- [ ] Fetch client data from Supabase
- [ ] Test logout flow

### ✏️ 5.2 Edit Profile (/profile/edit)
- [ ] Create edit profile form
- [ ] Add input fields (name, phone, DOB, etc.)
- [ ] Add form validation with Zod
- [ ] Implement update functionality
- [ ] Handle email change (requires verification)
- [ ] Add success/error messages
- [ ] Test form validation
- [ ] Test profile updates

### 🔒 5.3 Change Password (/profile/password)
- [ ] Create change password form
- [ ] Require current password
- [ ] Validate new password strength
- [ ] Implement password update via Supabase
- [ ] Add success/error messages
- [ ] Test password change flow

### 🔔 5.4 Notification Preferences (/profile/preferences)
- [ ] Create preferences page
- [ ] Add email notification toggles
- [ ] Add marketing preferences
- [ ] Save preferences to database
- [ ] Test preference updates

### 🔐 5.5 Security Settings (/profile/security)
- [ ] Display active sessions (optional)
- [ ] Show login history (optional)
- [ ] Add 2FA placeholder (future feature)
- [ ] Add device management (optional)

**Deliverable:** Complete Profile & Settings section

---

## 📋 PHASE 6: Notifications System (Week 9)

### 🔔 6.1 Notifications Center (/notifications)
- [ ] Create notifications page layout
- [ ] Build notification list component
- [ ] Build notification item card
- [ ] Add filter by type
- [ ] Implement "Mark as read" functionality
- [ ] Implement "Mark all as read" button
- [ ] Add "Clear all" option
- [ ] Fetch notifications from Supabase
- [ ] Update unread count in real-time
- [ ] Add empty state (no notifications)
- [ ] Test mark as read flow

### 🔔 6.2 Notification Bell Component
- [ ] Build notification bell icon
- [ ] Show unread count badge
- [ ] Add dropdown preview (latest 5)
- [ ] Link to full notifications page
- [ ] Update badge count real-time
- [ ] Add loading state
- [ ] Test dropdown interaction

### 🔔 6.3 Real-time Notifications (Optional)
- [ ] Set up Supabase Realtime subscriptions
- [ ] Subscribe to new notifications
- [ ] Show toast/banner for new notifications
- [ ] Update UI without page refresh
- [ ] Test real-time updates

**Deliverable:** Working notifications system

---

## 📋 PHASE 7: API Routes & Data Fetching (Ongoing)

### 🔌 7.1 API Routes Setup
- [ ] Create `/api/points/balance` route
- [ ] Create `/api/points/statement` route
- [ ] Create `/api/points/calculate` route
- [ ] Create `/api/trips/upcoming` route
- [ ] Create `/api/trips/[id]` route
- [ ] Create `/api/referrals/generate-code` route
- [ ] Create `/api/referrals/list` route
- [ ] Create `/api/notifications/list` route
- [ ] Create `/api/notifications/mark-read` route
- [ ] Create `/api/profile/update` route

### 🔌 7.2 Data Fetching Strategy
- [ ] Use Server Components for initial data
- [ ] Use SWR/React Query for client updates
- [ ] Implement optimistic updates where appropriate
- [ ] Add proper error handling
- [ ] Add retry logic
- [ ] Cache frequently accessed data
- [ ] Test loading states

### 🔌 7.3 Database Functions Integration
- [ ] Call `calculate_available_discount()` function
- [ ] Call `calculate_points_from_purchase()` function
- [ ] Call `generate_referral_code()` function
- [ ] Handle function errors gracefully
- [ ] Test all function calls

**Deliverable:** Robust API layer with error handling

---

## 📋 PHASE 8: Polish & UX Improvements (Week 10)

### 🎨 8.1 Loading States
- [ ] Add skeleton loaders for all pages
- [ ] Create loading skeletons for cards
- [ ] Add spinner for button actions
- [ ] Show loading for API calls
- [ ] Test loading states

### 🎨 8.2 Empty States
- [ ] Design empty state for no points
- [ ] Design empty state for no transactions
- [ ] Design empty state for no trips
- [ ] Design empty state for no referrals
- [ ] Design empty state for no notifications
- [ ] Add helpful CTAs in empty states
- [ ] Test all empty states

### 🎨 8.3 Error Handling
- [ ] Create error boundary components
- [ ] Add toast notifications for errors
- [ ] Create 404 page
- [ ] Create 500 page
- [ ] Add maintenance mode page
- [ ] Handle network errors gracefully
- [ ] Test error scenarios

### 🎨 8.4 Animations & Transitions
- [ ] Add page transitions
- [ ] Add card hover effects
- [ ] Add button press feedback
- [ ] Add smooth scrolling
- [ ] Add fade-in animations
- [ ] Keep animations subtle and fast
- [ ] Test on low-end devices

### 🎨 8.5 Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Add focus indicators
- [ ] Ensure color contrast meets WCAG AA
- [ ] Test with keyboard only
- [ ] Run Lighthouse accessibility audit

**Deliverable:** Polished, accessible user experience

---

## 📋 PHASE 9: Mobile Optimization (Week 11)

### 📱 9.1 Mobile-Specific Features
- [ ] Optimize touch targets (44px minimum)
- [ ] Add pull-to-refresh on lists
- [ ] Add swipe gestures where appropriate
- [ ] Optimize images for mobile
- [ ] Test on real devices (iOS & Android)
- [ ] Fix any mobile-specific bugs

### 📱 9.2 Performance Optimization
- [ ] Minimize bundle size
- [ ] Code split by route
- [ ] Lazy load images
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize fonts loading
- [ ] Run Lighthouse performance audit
- [ ] Achieve 90+ performance score

### 📱 9.3 Offline Support (Optional)
- [ ] Add service worker
- [ ] Cache critical assets
- [ ] Show offline indicator
- [ ] Queue actions when offline
- [ ] Test offline functionality

**Deliverable:** Fast, mobile-optimized experience

---

## 📋 PHASE 10: Security & RLS (Week 12)

### 🔒 10.1 Row Level Security Policies
- [ ] Add RLS policy for `clients` table
- [ ] Add RLS policy for `loyalty_transactions` table
- [ ] Add RLS policy for `referrals` table
- [ ] Add RLS policy for `notifications` table
- [ ] Add RLS policy for `bookings_cache` table
- [ ] Add RLS policy for `redemptions` table
- [ ] Test policies with different users
- [ ] Ensure users can only see their own data

### 🔒 10.2 API Security
- [ ] Validate all user inputs
- [ ] Sanitize data before database queries
- [ ] Rate limit API endpoints
- [ ] Add CSRF protection
- [ ] Add request validation middleware
- [ ] Test with invalid inputs
- [ ] Run security audit

### 🔒 10.3 Authentication Security
- [ ] Ensure JWT tokens are validated
- [ ] Add session timeout
- [ ] Implement refresh token rotation
- [ ] Add suspicious activity detection
- [ ] Test auth edge cases
- [ ] Add logging for security events

**Deliverable:** Secure, production-ready application

---

## 📋 PHASE 11: Testing & QA (Week 13)

### 🧪 11.1 Unit Testing
- [ ] Write tests for utility functions
- [ ] Write tests for API routes
- [ ] Write tests for database functions
- [ ] Achieve 80%+ code coverage
- [ ] Run tests in CI/CD

### 🧪 11.2 Integration Testing
- [ ] Test auth flow end-to-end
- [ ] Test points earning flow
- [ ] Test points redemption flow
- [ ] Test referral flow
- [ ] Test notification flow
- [ ] Test profile updates

### 🧪 11.3 User Acceptance Testing
- [ ] Create test scenarios
- [ ] Test with real users (5-10 people)
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Re-test after fixes

### 🧪 11.4 Cross-Browser Testing
- [ ] Test on Chrome
- [ ] Test on Safari
- [ ] Test on Firefox
- [ ] Test on Edge
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Fix any browser-specific issues

### 🧪 11.5 Performance Testing
- [ ] Run Lighthouse audits
- [ ] Test with slow 3G connection
- [ ] Test with 1000+ transactions
- [ ] Test with 100+ referrals
- [ ] Optimize slow queries
- [ ] Achieve <2s load time

**Deliverable:** Thoroughly tested application

---

## 📋 PHASE 12: Deployment & Launch (Week 14)

### 🚀 12.1 Pre-Deployment Checklist
- [ ] Set up production Supabase project
- [ ] Configure production environment variables
- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Set up CDN (Vercel Edge)
- [ ] Configure CORS policies
- [ ] Test production build locally

### 🚀 12.2 Deployment
- [ ] Deploy to Vercel (or hosting platform)
- [ ] Run database migrations on production
- [ ] Test production deployment
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Set up analytics (optional)
- [ ] Configure backup strategy
- [ ] Set up staging environment

### 🚀 12.3 Launch Preparation
- [ ] Write user documentation
- [ ] Create FAQ page
- [ ] Set up support email/chat
- [ ] Prepare launch announcement
- [ ] Train support team
- [ ] Plan rollout strategy

### 🚀 12.4 Post-Launch
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Plan iteration roadmap
- [ ] Celebrate launch! 🎉

**Deliverable:** Live, production-ready customer portal

---

## 📋 FUTURE ENHANCEMENTS (Post-Launch)

### 🔮 Phase 2 Features
- [ ] Email notifications for points earned
- [ ] Push notifications (PWA)
- [ ] Social login (Google, Apple)
- [ ] Two-factor authentication
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Export statements as PDF
- [ ] Advanced analytics dashboard
- [ ] Gamification (badges, streaks)
- [ ] Loyalty tiers (Silver, Gold, Platinum)
- [ ] Points expiry warnings
- [ ] Birthday bonus points
- [ ] Special promotions section
- [ ] Booking history visualizations
- [ ] Referral leaderboard

---

## 📊 PROGRESS TRACKING

### Overall Completion: 0%

**Phase 1:** ⬜⬜⬜⬜⬜ 0% (Foundation)  
**Phase 2:** ⬜⬜⬜⬜⬜ 0% (Dashboard & Points)  
**Phase 3:** ⬜⬜⬜⬜⬜ 0% (Trips)  
**Phase 4:** ⬜⬜⬜⬜⬜ 0% (Referrals)  
**Phase 5:** ⬜⬜⬜⬜⬜ 0% (Profile)  
**Phase 6:** ⬜⬜⬜⬜⬜ 0% (Notifications)  
**Phase 7:** ⬜⬜⬜⬜⬜ 0% (API Routes)  
**Phase 8:** ⬜⬜⬜⬜⬜ 0% (Polish)  
**Phase 9:** ⬜⬜⬜⬜⬜ 0% (Mobile)  
**Phase 10:** ⬜⬜⬜⬜⬜ 0% (Security)  
**Phase 11:** ⬜⬜⬜⬜⬜ 0% (Testing)  
**Phase 12:** ⬜⬜⬜⬜⬜ 0% (Deployment)  

---

## 🎯 MVP SCOPE (Weeks 1-8)

If you need to launch faster, here's the absolute MVP:

### ✅ Must Have:
1. **Auth:** Login, Signup, Password Reset
2. **Dashboard:** Points balance, Recent activity
3. **Points:** Overview, Statement (with filters)
4. **Trips:** List (Upcoming/Past), Detail page
5. **Profile:** View only (no editing)
6. **Mobile:** Bottom navigation working

### ⚠️ Nice to Have (Phase 2):
- Referral system
- Notifications
- Profile editing
- How to Earn/Redeem guides
- Calculators
- Advanced filtering

### ❌ Can Wait:
- Real-time notifications
- PWA features
- Dark mode
- Multi-language
- Advanced analytics

---

## 🛠️ TECHNICAL STACK

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui
- React Hook Form
- Zod

**Backend:**
- Supabase (Database + Auth)
- PostgreSQL
- Row Level Security
- Database Functions

**Deployment:**
- Vercel (Frontend)
- Supabase (Backend)

**Tools:**
- Git & GitHub
- Cursor (AI IDE)
- Figma (Optional)

---

## 📈 SUCCESS METRICS

### Week 4 Checkpoint:
- [ ] Auth works end-to-end
- [ ] Dashboard loads < 1s
- [ ] Points statement shows transactions
- [ ] Mobile navigation works

### Week 8 Checkpoint (MVP):
- [ ] All core pages functional
- [ ] Responsive on mobile & desktop
- [ ] No critical bugs
- [ ] 3 test users can complete key flows

### Week 14 Checkpoint (Launch):
- [ ] Lighthouse score: 90+ performance
- [ ] Zero critical security issues
- [ ] 95%+ uptime in staging
- [ ] Ready for production traffic

---

## 🚨 RISK MITIGATION

### Potential Blockers:
1. **Database schema changes** → Lock schema early, use migrations
2. **Supabase RLS complexity** → Test policies thoroughly in staging
3. **Mobile performance** → Profile early, optimize images
4. **Scope creep** → Stick to MVP, save features for Phase 2
5. **Browser compatibility** → Test early and often

### Contingency Plan:
- Keep MVP scope minimal
- Have backup hosting ready
- Document all decisions
- Regular backups of database

---

## ✅ COMPLETION CRITERIA

The application is **DONE** when:

✅ Users can sign up with optional referral code  
✅ Users can log in and see their points balance  
✅ Users can view complete points statement  
✅ Users can see their trip history  
✅ Users can generate and share referral links  
✅ Users can view and manage their profile  
✅ All pages work on mobile (375px) and desktop (1440px)  
✅ Loading states and errors are handled gracefully  
✅ No critical security vulnerabilities  
✅ Lighthouse score > 90 for performance  
✅ Application deployed to production  

---

**Estimated Effort:** 280-320 hours (8-10 weeks full-time)

**Priority Order:** Phase 1 → Phase 2 → Phase 3 → Phase 7 → Rest

**Start with:** Auth system → Dashboard → Points pages

Good luck! 🚀