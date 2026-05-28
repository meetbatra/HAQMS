# HAQMS Assignment Journey & Bug Resolution Report

## Approach and Reasoning Behind Major Decisions

My approach to stabilizing the Hospital Appointment & Queue Management System (HAQMS) was highly systematic and collaborative. First, I gave the entire codebase to my AI assistant, Antigravity, and explained the complete functionality of the application. Instead of jumping straight into writing code, I used Antigravity to identify all the bugs in the app by cross-referencing the official documentation of each technology used (React, Next.js, Express, Prisma, PostgreSQL).

Once the bugs were identified, I carefully reviewed all the issues and the fixes that Antigravity suggested. We then proceeded to fix each bug one by one, ensuring that every change was isolated, tested, and secure.

For the styling and UI components, I researched with Antigravity to find the best design patterns and layout principles for modern healthcare web applications. This helped resolve layout squashing and overlapping UI elements. Finally, during manual testing of the app, I found several hidden workflow bugs (such as the direct check-in button failing to sync with a doctor's scheduled bookings, and duplicate queue tokens being generated for the same patient) and tackled them organically as they arose.

## Issues Identified

When we started with the deliberately flawed codebase (containing roughly 44 bugs and flaws), the major issues fell into a few core categories:

1. **Security Vulnerabilities**:
   - Plaintext credential logging during authentication.
   - Leaky JWT token signatures.
   - SQL injection vulnerabilities in search endpoints.
   - Bypassed role authorization (e.g., users accessing Admin/Doctor endpoints).

2. **Concurrency & Database Integrity**:
   - Severe race conditions in the queue check-in logic generating duplicate tokens.
   - Missing unique schema constraints allowing double-booking of physicians at the exact same time.
   - Lack of cascading deletes causing database foreign-key constraint errors when trying to delete patients.

3. **Performance Bottlenecks**:
   - N+1 database querying loops in the appointment fetching and doctor-stats endpoints.
   - Event-loop blocking from sequential asynchronous database queries.

4. **Frontend & UX Flaws**:
   - A severe memory leak in the Live Public Queue Board due to improper React hooks.
   - Layout squashing in the Patient Registry (search bar overlapping with the gender dropdown).
   - Unprotected buttons and incorrect routing (Admin direct check-in buttons routing to unauthorized doctor views).
   - "Cannot read properties of null" fatal crashes when viewing patients with empty medical histories.

## Fixes Implemented

Working systematically through the identified issues, I implemented the following fixes:

- **Security Hardening**: Replaced vulnerable raw SQL queries with Prisma's parameterized queries. Enforced strict Role-Based Access Control (RBAC) middleware across all API routes and conditionally rendered frontend components based on the user's role.
- **Database & Concurrency**: Restructured the queue token generation using Prisma `$transaction` blocks to establish a safe locking mechanism. I also added explicit unique constraints in `schema.prisma` to prevent duplicate time-slot bookings.
- **Foreign Key Resolutions**: Fixed the patient deletion endpoint by wrapping it in a transaction that first deletes all associated `QueueToken` and `Appointment` records before deleting the `Patient` record.
- **UI/UX Stabilization**: Fixed the React memory leaks by properly handling component unmounting in `useEffect` hooks. Re-styled the admin/receptionist dashboards to fix input widths and padding, ensuring text no longer gets hidden behind icons.
- **Workflow Corrections**: Fixed the "Direct Check-In" routing bug on the Admin dashboard, merging the scheduling and queueing tabs correctly so that unauthorized roles do not accidentally trigger doctor-specific components.

## Optimizations Performed

- **Network & Rendering**: Implemented a debounce utility for the patient search inputs to drastically reduce network throughput and prevent unnecessary re-renders on every keystroke.
- **Query Optimization**: Refactored the N+1 queries in `reports.js` and `appointments.js` to utilize bulk database fetching (`include` and `select` via Prisma) rather than looping over arrays to execute secondary queries.
- **Codebase Clean-up**: Stripped all "deliberately flawed assignment" metadata, fake bug comments, and evaluation instructions from the codebase, transitioning it fully to `v1.0.0` production readiness.
- **Production Environment**: Migrated from a local database setup to a robust Supabase PostgreSQL cloud database, configuring the environment variables for seamless deployment.

## Remaining Known Issues

While the application is now highly stable and production-ready, there are a few minor considerations for the future:
1. **Reporting Scalability**: While the N+1 queries have been resolved, the `doctor-stats` reporting logic aggregates data in-memory. If the clinic scales to thousands of doctors, this should be pushed down into a raw SQL aggregation view for maximum performance.
2. **WebSocket Fallbacks**: The frontend queue board relies heavily on real-time polling/updates. In environments with poor connectivity, implementing a more robust WebSocket reconnection strategy with offline caching could improve the UX.
3. **Automated Testing**: Now that the core workflow bugs are squashed, the project would benefit from a comprehensive Cypress or Playwright E2E testing suite to ensure regressions do not occur in the booking workflows.
