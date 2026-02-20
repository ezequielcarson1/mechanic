# Screens Documentation 📱

This document provides a detailed explanation of every screen in the Mechanic application, organized by flow and navigation structure.

## 🏁 Core Entry & Onboarding

- **Root Redirect (`app/index.tsx`)**: The entry point that handles initial routing logic, typically redirecting users to onboarding or the main app based on authentication state.
- **Onboarding (`app/onboarding.tsx`)**: A carousel-based introduction for new users, highlighting key features like professional services, immediate assistance, and video calls.
- **Login (`app/login.tsx`)**: Unified authentication screen. Supports smart phone formatting `(000) 000-0000` and validation. Dummy credentials: `+1 1` (Mechanic), `+1 2` (User).

## 🛠️ Registration & Setup Flow

This flow uses the `UserDAO` to check for existing accounts and perform transaction-based registration across multiple database tables.

- **Phone Number (`app/setup/index.tsx`)**: Initial step that checks if the phone number is already registered using `checkPhoneExists`.
- **OTP Verification (`app/setup/otp.tsx`)**: Verification screen for the 6-digit SMS code.
- **Basic Info (`app/setup/basic-info.tsx`)**: Collects primary profile details.
- **Credentials (`app/setup/credentials.tsx`)**: Security setup for password-based access.
- **Identity Verification (`app/setup/identity.tsx`)**: Interface for uploading photos of ID documents.
- **Address Details (`app/setup/address.tsx`)**: Collects address, persisted in the `user_addresses` table.
- **Mechanic Expertise (`app/setup/expertise.tsx`)**: Professional details for mechanics, persisted in `mechanic_details`.
- **Availability (`app/setup/availability.tsx`)**: Weekly schedule configuration, persisted in `mechanic_availability`.
- **Dealer Info (`app/setup/dealer-info.tsx`)**: Optional affiliation details for dealer-linked mechanics.
- **Setup Success (`app/setup/success.tsx`)**: Final confirmation and transition to the main app dashboard.

## 🏠 Main Application (Tabs)

The core experience for logged-in users, managed via a bottom tab navigator.

### 🆘 Assist Tab
- **Assist Feed (`app/(tabs)/assist/index.tsx`)**: The main dashboard showing available assistance requests. **Restricted to Mechanics**: Users are automatically redirected if they attempt to access this tab (or it may be hidden in future iterations). Includes an availability toggle and promo banners.
- **Filter (`app/(tabs)/assist/filter.tsx`)**: Advanced filtering options for requests based on type, distance, or budget.
- **Request Detail (`app/(tabs)/assist/[id].tsx`)**: Deep dive into a specific request, allowing the mechanic to select their availability and accept the job.

### 📅 Appointments Tab
- **Appointments List (`app/(tabs)/appointments.tsx`)**: Manages accepted jobs, split into "Upcoming" and "Past" appointments.
- **Appointment Detail (`app/appointments/[id].tsx`)**: A comprehensive management screen for active jobs, featuring:
    - **Assistance Info**: Job details and on-site QR code scanning.
    - **Client Info**: Payer details, contact options, and rating system.
    - **Assist Status**: Timeline and status updates (Arrived, Delayed, Completed).
    - **Budget**: Financial breakdown and payment request triggers.
- **Cancel Reason (`app/appointments/cancel-reason.tsx`)**: A structured feedback screen for mechanics when they need to cancel an accepted appointment.

### 💬 Communication & Support
- **Messaging (`app/chat/[id].tsx`)**: Real-time chat interface to communicate directly with clients regarding their specific job requests.
- **Help Center (`app/(tabs)/help.tsx`)**: Support hub with FAQ sections and direct links to live chat or contact options.
- **Live Chat (`app/(tabs)/live-chat.tsx`)**: Dedicated interface for real-time support from the platform team.
- **Notifications Feed (`app/(tabs)/notifications.tsx`)**: A dedicated feed for system alerts and community updates.

### 👤 Profile & Settings
- **Profile Home (`app/(tabs)/index.tsx`)**: The primary profile dashboard. **Role-Aware (RBAC)**:
  - **Mechanics** see professional toggles (On-Line/Off-Line) and specific menu items (ASE Certifications, Payments, Promotions).
  - **Regular Users** see a simplified menu focused on personal info and settings.
- **Personal Info (`app/(tabs)/personal-info.tsx`)**: Edit profile details like name, email, and date of birth. Supports profile picture updates (persisted in SQLite).
- **ASE Certifications (`app/(tabs)/ase.tsx`)**: Management screen for mechanics to validate their certifications.
- **Settings Home (`app/(tabs)/settings.tsx`)**: Main settings hub for navigation to sub-sections like privacy, notifications, and security.
- **Notification Settings (`app/settings/notifications.tsx`)**: Granular toggles for system alerts, sounds, and promotions.
- **Security (`app/settings/password.tsx`)**: Interface for changing or resetting account passwords.
- **Delete Account (`app/settings/delete-account.tsx`)**: Account termination flow with confirmation safeguards.

## 🛡️ Admin Portal (`/admin-portal`)

A dedicated web-based dashboard for administrators to manage the platform's data and operations.

- **Dashboard Home**: Overview of system statistics and shortcuts.
- **Appointments Management**: Full table view of all appointments with filtering and sorting capabilities.
- **User Management**: Tools to view, search, and manage user accounts and roles.

## 🥗 Miscellaneous
- **Explore (`app/(tabs)/explore.tsx`)**: A placeholder screen used for exploring new features or developer guides.
- **Privacy (`app/(tabs)/privacy.tsx`)**: Displays the platform's privacy policy and data handling terms.
- **Payments (`app/(tabs)/payments.tsx`)**: Dashboard for tracking earnings and managing payout methods.
- **Promotions (`app/(tabs)/promotions.tsx`)**: View active rewards and incentive programs for mechanics.
- **Modal (`app/modal.tsx`)**: A generic modal component utilized for various overlay alerts throughout the app.
