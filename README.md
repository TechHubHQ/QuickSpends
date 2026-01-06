# QuickSpends

QuickSpends is a comprehensive personal finance tracking application built with Expo and Supabase. It allows users to manage transactions, budgets, savings, loans, and more with a smooth and intuitive mobile interface.

## Project Structure

```text
QuickSpends
├── app/                  # Expo Router pages and layouts
│   ├── (tabs)/           # Main tab-based navigation
│   ├── account-details/  # Account management screens
│   ├── group/            # Group expense sharing screens
│   ├── _layout.tsx       # Root layout configuration
│   └── index.tsx         # App entry point
├── assets/               # Static assets (images, fonts, etc.)
├── scripts/              # Maintenance and setup scripts
│   ├── setup-db.ts       # Database initialization script
│   └── reset-project.js  # Project reset utility
├── src/                  # Application source code
│   ├── components/       # Reusable UI components
│   ├── config/           # Application configuration
│   ├── context/          # React Context providers (Auth, Theme, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library initializations (Supabase, etc.)
│   ├── screens/          # Core screen components
│   ├── styles/           # Global styles and themes
│   ├── theme/            # Theme definitions
│   └── utils/            # Utility functions
├── supabase/             # Supabase configuration and migrations
│   └── migrations/       # SQL migration files
├── app.json              # Expo configuration
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo Go](https://expo.dev/go) app on your mobile device or an emulator
- [Supabase](https://supabase.com/) account and project

### Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd QuickSpends
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    EXPO_SUPABASE_DB_URL=your-postgresql-connection-string
    ```
    > [!NOTE]
    > `EXPO_SUPABASE_DB_URL` is required for running the database setup and migration scripts.

4.  **Setup the Database**:
    Run the setup script to create the necessary tables and seed default categories:
    ```bash
    npm run db:setup
    ```

### Running the App

- **Start the development server**:
  ```bash
  npm run start
  ```
- **Run on Android**:
  ```bash
  npm run android
  ```
- **Run on iOS**:
  ```bash
  npm run ios
  ```

## Available Scripts

- `npm run start`: Starts the Expo development server with cache cleared.
- `npm run db:setup`: Initializes the Supabase database schema and seeds default data.
- `npm run db:migrate`: Runs database migrations.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run build:android:preview`: Builds an Android preview using EAS.
- `npm run reset-project`: Resets the project to a clean state.