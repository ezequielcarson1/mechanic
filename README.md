# Mechanic App 🛠️

A mobile application built with Expo and React Native, designed for managing mechanical assistance requests, appointments, and communication between mechanics and clients.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Mechanic
   ```

2. Install dependencies for frontend, backend, and admin portal:
   ```bash
   npm install
   cd server && npm install && cd ..
   cd admin-portal && npm install && cd ..
   ```

3. Start the backend server:
   ```bash
   cd server && node index.js
   ```

4. Start the Admin Portal (Vite):
   ```bash
   cd admin-portal && npm run dev
   ```

5. Start the mobile development server:
   ```bash
   npx expo start
   ```

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (Mobile) & [React Router](https://reactrouter.com/) (Admin)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Mobile) & [Tailwind CSS](https://tailwindcss.com/) (Admin)
- **Admin Portal**: Build with [Vite](https://vitejs.dev/) & React
- **Backend**: Node.js with Express
- **Database**: SQLite (via `sqlite3`)
- **Data Access**: Custom DAO (Data Access Object) Pattern
- **Icons**: [Lucide React Native](https://lucide.dev/) & [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Data Persistence**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 🏗️ Architecture: DAO & API System

The application uses a decoupled **DAO (Data Access Object)** architecture to manage data flow between the frontend and the backend.

### Frontend Layer (`/lib/dao`)
- **Interfaces**: Define the structure of data and the contract for data operations.
- **DAO Implementations**: Handle API calls using a centralized `apiClient`.
- **Context API**: Provides global state management (e.g., `UserContext`, `AppointmentsContext`) by consuming the DAOs.

### Backend Layer (`/server`)
- **Express Server**: Exposes RESTful API endpoints.
- **SQLite Database**: Stores persistent data in `mechanic.db`.
  - **Tables**:
    - `users`: Core profile data (email, name, phone, role, etc.).
    - `user_addresses`: Address details linked to users.
    - `user_vehicles`: Vehicle information for "user" role.
    - `mechanic_details`: Professional info (experience, certifications, etc.) for "mechanic" role.
    - `mechanic_availability`: Weekly schedules for mechanics.
    - `assistance_requests`: Open jobs dashboard data.
    - `appointments`: Accepted jobs with status and milestone tracking.
    - `additional_funds`: Pending/approved financial adjustments.
    - `appointment_reviews`: Post-job feedback and ratings.
    - `setup_progress`: Persists multi-step registration states.

## 👥 Role-Based Access Control (RBAC)

The app supports two primary user roles: **Mechanic** and **User**.

### Role Logic
Roles are defined in the database during registration.
- **Mechanic**: Access to job feed, availability toggles, and professional metrics.
- **User**: Access to personal vehicle management and assistance requests.

For testing, dummy users are provided with roles pre-assigned:
- Phone: `+1 1` -> **Mechanic**
- Phone: `+1 2` -> **User**

### Feature Toggles
The UI dynamically adapts based on the user's role:
- **Mechanics** see:
  - Availability/Status Toggle (On-Line/Off-Line).
  - Specialized menu items: ASE Certifications, Bank Account/Payments, Promotions.
  - The "Assist Feed" for finding jobs.
- **Users** see:
  - A simplified profile without mechanic-specific professional features.

## 📂 Project Structure

```text
├── app/                  # Expo Router - Main application screens and routing
│   ├── (tabs)/           # Tab-based navigation (Assist, Appointments, Chat, Profile)
│   ├── appointments/     # Appointment-specific screens (Details, Cancellation)
│   ├── chat/             # Messaging and chat features
│   ├── settings/         # User settings and configuration
│   ├── setup/            # Initial setup and configuration screens
│   ├── login.tsx         # Authentication screen
│   ├── onboarding.tsx    # User onboarding flow
│   └── _layout.tsx       # Root layout configuration
├── components/           # Reusable UI components
│   ├── ui/               # Core UI building blocks (Buttons, Cards, etc.)
│   └── ...               # Feature-specific components
├── hooks/                # Custom React hooks (Theme, Color Scheme, etc.)
├── lib/                  # Utility libraries and external integrations
│   ├── supabase.ts       # Supabase client configuration
│   ├── storage.ts        # AsyncStorage wrapper
│   └── utils.ts          # General utility functions
├── constants/            # App-wide constants (colors, layout, etc.)
├── context/              # React Context Providers for global state
├── assets/               # Static assets (images, fonts, etc.)
└── scripts/              # Utility scripts for development
```

## ✨ Key Features

- **Mechanical Assistance**: Request and track real-time mechanical help.
- **Appointment Management**: Dashboard for upcoming and past jobs.
- **Persistent Login**: Secure phone-based authentication with session persistence via `AsyncStorage`.
- **Certification Tracking**: ASE certification validation for mechanics.
- **Flexible Status**: Mechanics can toggle availability status.
- **Profile Management**: Update personal info and profile pictures.
- **Robust Registration**: Multi-step registration flow with backend SQL transactions ensuring data integrity across multiple tables.
- **Smart Formatting**: Automated phone number formatting `(000) 000-0000` for consistent data entry.

## 🧪 Technical Specifications

### Available Scripts

- `npm run start`: Starts the Expo development server.
- `npm run ios`: Opens the app in the iOS simulator.
- `npm run android`: Opens the app in the Android emulator.
- `npm run web`: Opens the app in a web browser.
- `npm run lint`: Runs ESLint to check for code quality issues.

### Environment Requirements

The services communicate on the following ports:
- **Backend API**: `http://localhost:3000`
- **Admin Portal**: `http://localhost:3001`
- **iOS Simulator**: Uses `http://localhost:3000`
- **Android Emulator**: Uses `http://10.0.2.2:3000`

Ensure the backend server is running for the app to function correctly.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and for internal use only.
# mechanic
