# Customer Loyalty Portal - Product Requirements Document (PRD)

**Project:** Customer Loyalty Portal  
**Version:** 1.0  
**Date:** November 2024  
**Status:** 🟢 Ready for Development  

---

## 📋 Executive Summary

A mobile-first customer portal that allows customers to:
- View and manage their loyalty points
- Track past and upcoming trips
- Refer friends for bonus points
- Redeem points for discounts on bookings
- View complete points statement

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **UI:** Shadcn/ui (Tailwind CSS)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Deployment:** Vercel

---

## 🎯 Business Objectives

1. **Increase Customer Retention** - Incentivize repeat bookings
2. **Generate Referrals** - Organic customer acquisition
3. **Reduce Support Burden** - Self-service trip and points management
4. **Build Loyalty** - Reward high-value customers
5. **Data Collection** - Track customer behavior and preferences

---

## 👥 Target Users

**Primary Users:**
- Existing customers who have booked trips
- New customers signing up via referral links
- Mobile-first users (70%+ mobile traffic expected)

**User Personas:**

### Persona 1: Sarah - The Frequent Traveler
- Age: 32, London
- Books 3-4 F1 trips per year
- Wants: Quick access to upcoming trips, maximize points
- Device: iPhone, uses portal on-the-go

### Persona 2: Mike - The Referrer
- Age: 45, Manchester  
- Booked 1 trip, loved it
- Wants: Easy way to recommend to friends
- Device: Android, checks portal occasionally

### Persona 3: Emma - First Time User
- Age: 28, Birmingham
- Signed up via friend's referral link
- Wants: Understand how loyalty works, see her 100 bonus points
- Device: iPhone, new to the brand

---

## 🎨 Design Principles

1. **Mobile-First** - Optimized for smartphones, scales to desktop
2. **Simple & Clear** - No confusion about points or bookings
3. **Fast** - Instant loading, optimistic UI updates
4. **Accessible** - WCAG 2.1 AA compliant
5. **Trust** - Clear security, transparent point tracking

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│           Next.js 15 App Router                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Pages      │  │  Components  │            │
│  │  /login      │  │  - Auth      │            │
│  │  /signup     │  │  - Dashboard │            │
│  │  /dashboard  │  │  - Trips     │            │
│  │  /points     │  │  - Points    │            │
│  │  /referral   │  │  - Referral  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│              Supabase Backend                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Auth    │  │   API    │  │ Realtime │     │
│  │  (JWT)   │  │  (RPC)   │  │  (WS)    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│           PostgreSQL Database                   │
│  - clients (with loyalty fields)                │
│  - loyalty_transactions                         │
│  - referrals                                    │
│  - bookings_cache                               │
│  - notifications                                │
└─────────────────────────────────────────────────┘
```

---

## 📱 Features & Requirements

### Phase 1: Authentication & Profile (Week 1-2)

#### 1.1 Sign Up
**User Story:** As a new user, I want to create an account so I can access the loyalty portal.

**Requirements:**
- Email + password signup
- Optional: Sign up with referral code
- Email verification required
- Password requirements: min 8 chars, 1 number, 1 special char
- Auto-login after signup
- Welcome email sent

**Acceptance Criteria:**
- [ ] User can create account with email/password
- [ ] Referral code validated if provided
- [ ] Email verification sent immediately
- [ ] User redirected to dashboard after signup
- [ ] 100 points awarded if referral code valid
- [ ] Error handling for duplicate emails

**Design Notes:**
- Simple, clean form
- Show password strength indicator
- "Sign up with referral code" as optional expansion
- Mobile keyboard optimization (email type, etc.)

---

#### 1.2 Login
**User Story:** As a returning user, I want to log in so I can access my account.

**Requirements:**
- Email + password login
- "Remember me" checkbox
- "Forgot password" link
- Biometric login (mobile) - Future
- Auto-logout after 30 days inactivity

**Acceptance Criteria:**
- [ ] User can log in with valid credentials
- [ ] Error shown for invalid credentials
- [ ] "Remember me" persists session
- [ ] Password reset flow works
- [ ] Redirect to intended page after login

**Design Notes:**
- Minimize fields (email, password, submit)
- Clear error messages
- "New here? Sign up" link prominent

---

#### 1.3 Forgot Password
**User Story:** As a user, I want to reset my password if I forget it.

**Requirements:**
- Email-based password reset
- Secure reset token (expires in 1 hour)
- New password requirements enforced
- Confirmation email sent

**Acceptance Criteria:**
- [ ] User receives reset email within 1 minute
- [ ] Reset link works and expires after 1 hour
- [ ] User can set new password
- [ ] Old password no longer works
- [ ] Confirmation email sent

---

#### 1.4 Profile Management
**User Story:** As a user, I want to view and update my profile.

**Requirements:**
- View/edit: Name, email, phone, DOB
- View only: Member since, loyalty status
- Change password option
- Profile photo upload - Future

**Acceptance Criteria:**
- [ ] User can view all profile fields
- [ ] User can edit name, phone, DOB
- [ ] Email change requires verification
- [ ] Password change requires old password
- [ ] Changes saved and confirmed

**UI Components:**
```
Profile Screen:
├─ Avatar (placeholder)
├─ Name (editable)
├─ Email (editable with verification)
├─ Phone (editable)
├─ DOB (editable)
├─ Member Since (read-only)
├─ Loyalty Status (read-only badge)
└─ Change Password (button)
```

---

### Phase 2: Dashboard & Points (Week 3-4)

#### 2.1 Dashboard Home
**User Story:** As a user, I want to see an overview of my account at a glance.

**Requirements:**
- Points balance (prominent)
- Quick stats: Total trips, upcoming trips, total spent
- Recent activity (last 5 transactions)
- Quick actions: Refer friend, View statement, Book trip
- Notifications badge

**Acceptance Criteria:**
- [ ] Dashboard loads in <1 second
- [ ] All data accurate and real-time
- [ ] Quick actions are functional
- [ ] Responsive on all screen sizes
- [ ] Loading states for async data

**UI Layout (Mobile):**
```
┌─────────────────────────────┐
│  👤 Hi, Sarah               │
│                             │
│  ┌─────────────────────┐   │
│  │   3,500 Points      │   │
│  │   £3,500 value      │   │
│  └─────────────────────┘   │
│                             │
│  Quick Stats:               │
│  📅 2 Upcoming Trips        │
│  ✈️ 8 Past Trips            │
│  💰 £45,290 Total Spend     │
│                             │
│  Recent Activity            │
│  ┌─────────────────────┐   │
│  │ +226 pts            │   │
│  │ F1 Abu Dhabi        │   │
│  │ Nov 15, 2024        │   │
│  └─────────────────────┘   │
│                             │
│  Quick Actions:             │
│  [Refer Friend] [Book]      │
└─────────────────────────────┘
```

---

#### 2.2 My Points
**User Story:** As a user, I want to view my points balance and understand how to use them.

**Requirements:**
- Current points balance
- Points breakdown: Available vs Reserved
- Earning rate display (£20 = 1 point)
- Redemption rules (chunks of 100)
- Points statement link
- How it works (help section)

**Acceptance Criteria:**
- [ ] Points balance accurate to real-time
- [ ] Clear explanation of earning/spending
- [ ] Visual progress to next 100 points
- [ ] Easy access to full statement
- [ ] Help content is clear

**UI Components:**
```
My Points Screen:
├─ Points Balance Card
│  ├─ Available: 3,500
│  ├─ Reserved: 200 (on pending quote)
│  └─ Next reward: 4,500 (73% there)
├─ How to Earn
│  └─ £20 spent = 1 point earned
├─ How to Redeem
│  └─ Use 100 points = £100 off
├─ [View Full Statement] button
└─ [Refer Friend for 100pts] button
```

---

#### 2.3 Points Statement
**User Story:** As a user, I want to see a complete history of all my point transactions.

**Requirements:**
- All transactions (earned, spent, refunded)
- Filterable by date range, type
- Sortable by date, points
- Downloadable as PDF - Future
- Infinite scroll / pagination

**Acceptance Criteria:**
- [ ] All transactions displayed accurately
- [ ] Filters work correctly
- [ ] Sorting works correctly
- [ ] Performance good with 1000+ transactions
- [ ] Mobile-optimized list view

**Transaction Types:**
- ✅ Earned (green) - From bookings, referrals
- ❌ Spent (red) - Redemptions
- 🔄 Refunded (blue) - Cancelled bookings
- ⚙️ Adjusted (orange) - Admin adjustments

---

### Phase 3: Trips Management (Week 5-6)

#### 3.1 Upcoming Trips
**User Story:** As a user, I want to see all my upcoming trips in one place.

**Requirements:**
- List of confirmed upcoming trips
- Sorted by event date (soonest first)
- Each trip shows:
  - Event name & dates
  - Booking reference
  - Total amount paid
  - Points earned
  - Booking status
- Tap to view full details
- Add to calendar option

**Acceptance Criteria:**
- [ ] Only shows confirmed/upcoming trips
- [ ] Accurate dates and details
- [ ] Sorted correctly
- [ ] Full details view works
- [ ] Calendar export works

**UI Layout:**
```
Upcoming Trips Screen:
├─ Trip Card 1
│  ├─ 🏎️ F1 Abu Dhabi 2024
│  ├─ Dec 1-3, 2024
│  ├─ Ref: F1ABU-2024-0156
│  ├─ £4,529 | +226 pts earned
│  └─ [View Details]
├─ Trip Card 2
│  ├─ 🏎️ F1 Monaco 2025
│  └─ ...
└─ Empty State: "No upcoming trips"
```

---

#### 3.2 Past Trips
**User Story:** As a user, I want to see my booking history.

**Requirements:**
- List of completed trips
- Sorted by event date (newest first)
- Same details as upcoming trips
- Infinite scroll for long history
- Option to rebook / book similar

**Acceptance Criteria:**
- [ ] Shows only past trips
- [ ] Performance good with many trips
- [ ] Rebook action works
- [ ] Trip details accurate

---

#### 3.3 Trip Details
**User Story:** As a user, I want to see complete details of a specific trip.

**Requirements:**
- Event name, dates, location
- Booking reference
- Total amount & payment status
- Points earned/used
- Included items/services
- Contact information
- Documents (tickets, confirmations) - Future
- Support chat - Future

**Acceptance Criteria:**
- [ ] All details accurate
- [ ] Easy to read and navigate
- [ ] Contact options clear
- [ ] Can navigate back easily

---

### Phase 4: Referral System (Week 7)

#### 4.1 Refer a Friend
**User Story:** As a user, I want to refer friends to earn bonus points.

**Requirements:**
- Enter friend's email
- Generate unique referral link
- Share via email, SMS, WhatsApp, Copy link
- Track referral status
- See pending/completed referrals
- Terms & conditions clear

**Acceptance Criteria:**
- [ ] Can enter and validate email
- [ ] Referral link generated and unique
- [ ] Multiple share methods work
- [ ] Email invitation sent
- [ ] Referral tracked correctly
- [ ] Status updates in real-time

**Referral Flow:**
```
Refer Friend Screen:
├─ Header
│  ├─ "Give £100, Get £100"
│  └─ "Both you and your friend benefit!"
├─ Enter Friend's Email
│  └─ [Input field with validation]
├─ Or Share Your Link
│  └─ [Copy Link Button]
├─ Share Options
│  ├─ [Email] [WhatsApp] [SMS]
│  └─ [Copy Link]
├─ How It Works
│  ├─ 1. Friend signs up (+100 pts)
│  ├─ 2. Friend makes first booking
│  └─ 3. You get 100 pts!
└─ My Referrals
   ├─ Pending: 2
   └─ Completed: 5 (+500 pts earned)
```

---

#### 4.2 My Referrals
**User Story:** As a user, I want to track my referrals and see rewards earned.

**Requirements:**
- List all referrals
- Status per referral: Pending, Signed Up, Completed
- Points earned per referral
- Friend's first name (privacy-safe)
- Date of referral
- Resend invitation option

**Acceptance Criteria:**
- [ ] All referrals displayed
- [ ] Status accurate and updates
- [ ] Points calculation correct
- [ ] Can resend invitations
- [ ] Privacy maintained

**Referral Status:**
- 🕐 **Pending** - Invited, not signed up yet
- ✅ **Signed Up** - Signed up, earned 100 pts
- 🎉 **Completed** - Made first booking, you earned 100 pts

---

### Phase 5: Notifications (Week 8)

#### 5.1 In-App Notifications
**User Story:** As a user, I want to be notified of important events.

**Requirements:**
- Notification bell icon with badge count
- List of notifications (newest first)
- Mark as read/unread
- Delete notification
- Notification types:
  - Points earned
  - Points spent
  - Referral signed up
  - Referral completed
  - Booking confirmed
  - Booking cancelled
  - System messages

**Acceptance Criteria:**
- [ ] Real-time updates (WebSocket)
- [ ] Unread count accurate
- [ ] Mark as read works
- [ ] Delete works
- [ ] Notifications persist

---

### Phase 6: Settings & Help (Week 9)

#### 6.1 Settings
**Requirements:**
- Email preferences (marketing, transactional)
- Notification preferences (push, email)
- Privacy settings
- Delete account option
- Language preference - Future

---

#### 6.2 Help & Support
**Requirements:**
- FAQ section
  - How do I earn points?
  - How do I use points?
  - What are the referral rewards?
  - How long do points last?
  - etc.
- Contact support (email/form)
- Live chat - Future

---

## 🎨 UI/UX Specifications

### Color Palette
```
Primary: #000000 (Black) - Brand color
Secondary: #FFFFFF (White)
Accent: #10B981 (Green) - Success, points earned
Warning: #F59E0B (Orange) - Pending, warnings
Error: #EF4444 (Red) - Points spent, errors
Neutral: #6B7280 (Gray) - Text, borders
```

### Typography
```
Font Family: Inter (default Shadcn)
Headings: Font Weight 700
Body: Font Weight 400
Small: Font Weight 300
```

### Spacing
```
Mobile: 16px padding
Desktop: 24px padding
Component spacing: 8px, 16px, 24px, 32px
```

### Responsive Breakpoints
```
Mobile: < 768px (primary focus)
Tablet: 768px - 1024px
Desktop: > 1024px
```

### Component Library (Shadcn)
- Button
- Input
- Card
- Badge
- Dialog
- Dropdown Menu
- Form
- Tabs
- Toast
- Avatar
- Separator
- Progress

---

## 🔐 Security Requirements

1. **Authentication**
   - JWT tokens via Supabase Auth
   - Secure HTTP-only cookies
   - Token refresh on expiry
   - Rate limiting on login attempts

2. **Authorization**
   - Row Level Security (RLS) policies
   - Users can only access their own data
   - Admin routes protected

3. **Data Protection**
   - HTTPS only
   - Input validation on all forms
   - XSS protection
   - CSRF protection
   - SQL injection prevention (Supabase handles)

4. **Privacy**
   - GDPR compliant
   - Data retention policies
   - Right to deletion
   - Privacy policy link

---

## 📊 Analytics & Tracking

**Events to Track:**
- Sign up completed
- Login successful
- Points viewed
- Statement viewed
- Trip details viewed
- Referral sent
- Referral completed
- Points redeemed
- Error occurred

**Tools:**
- Google Analytics 4
- Vercel Analytics
- Custom event tracking via Supabase

---

## 🚀 Performance Requirements

- **Page Load:** < 2 seconds (mobile 3G)
- **Time to Interactive:** < 3 seconds
- **Lighthouse Score:** 90+ (all categories)
- **Core Web Vitals:**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

**Optimization Strategies:**
- Image optimization (Next.js Image)
- Code splitting
- Lazy loading
- Caching (SWR)
- CDN delivery (Vercel Edge)

---

## 🧪 Testing Requirements

**Unit Tests:**
- All utility functions
- Form validation logic
- Points calculation logic

**Integration Tests:**
- Auth flows (signup, login, reset)
- CRUD operations
- API calls

**E2E Tests:**
- Critical user journeys:
  - Sign up → Dashboard → View Points
  - Login → Refer Friend → View Referrals
  - View Trips → Trip Details

**Accessibility Testing:**
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios

---

## 📅 Development Timeline

**Week 1-2: Setup & Auth**
- Project setup (Next.js + Supabase)
- Authentication (signup, login, reset)
- Profile management

**Week 3-4: Dashboard & Points**
- Dashboard home
- My Points screen
- Points statement

**Week 5-6: Trips**
- Upcoming trips
- Past trips
- Trip details

**Week 7: Referrals**
- Refer a friend
- My referrals
- Referral tracking

**Week 8: Notifications**
- In-app notifications
- Real-time updates

**Week 9: Polish**
- Settings & help
- Performance optimization
- Bug fixes
- User acceptance testing

**Week 10: Launch**
- Production deployment
- Monitoring setup
- Launch to customers

---

## 🎯 Success Metrics

**Launch Targets (30 days):**
- 80%+ of existing customers sign up
- 50+ referrals sent
- 10+ referral conversions
- 20+ point redemptions
- < 5% support tickets about portal
- 90+ NPS score

**Long-term (6 months):**
- 40% increase in repeat bookings
- 100+ completed referrals
- 50% reduction in support queries
- 4.5+ star app rating

---

## 🔄 Future Enhancements (Phase 2)

- Push notifications (mobile)
- Biometric login
- Profile photo upload
- Social login (Google, Apple)
- Multiple languages
- Dark mode
- Trip reviews/ratings
- Loyalty tiers (Silver, Gold, Platinum)
- Special offers/promotions
- Gamification (badges, achievements)
- Mobile app (React Native)

---

## 📚 Dependencies

**Required Services:**
- Supabase account & project
- Vercel account (hosting)
- Email service (SendGrid/Resend)
- Domain name for portal

**Third-Party Libraries:**
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Supabase JS client
- React Hook Form
- Zod (validation)
- date-fns
- SWR (data fetching)

---

## 📞 Stakeholders

**Product Owner:** [Your Name]
**Development Team:** [Team]
**Designers:** [Design Team]
**QA:** [QA Team]

**Communication:**
- Daily standups
- Weekly sprint reviews
- Slack channel: #loyalty-portal
- GitHub: Issues & PRs

---

## ✅ Definition of Done

A feature is considered "done" when:
- [ ] Code written and reviewed
- [ ] Unit tests pass (>80% coverage)
- [ ] E2E tests pass for happy path
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessible (keyboard, screen reader)
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Deployed to staging
- [ ] Product owner approval
- [ ] Documentation updated

---

## 📝 Appendix

### A. API Endpoints (Supabase RPC)
- `update_client_points()`
- `enroll_client_in_loyalty()`
- `process_referral_signup()`
- `process_first_loyalty_booking()`
- `calculate_available_discount()`
- `check_referral_validity()`
- `generate_referral_code()`

### B. Database Schema
- See `loyalty_schema_v3.0_using_clients.sql`

### C. Design Mockups
- See Figma link: [TBD]

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** ✅ Approved for Development
