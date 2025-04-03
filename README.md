# Password Manager

A modern password management application built with Laravel 12 and React. This application provides a secure way to manage passwords with a sleek and responsive user interface.

## Features

- **User Authentication**: Secure login and registration system
- **Password Management**: Store, retrieve, and manage passwords securely
- **Advanced Datatable**: Sorting, filtering, searching, and pagination
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes

## Tech Stack

### Backend
- Laravel 12
- PHP 8.2+
- Repository/Service Pattern
- RESTful API
- SQLite (dev) / MySQL or PostgreSQL (production)

### Frontend
- React 19
- TypeScript
- TanStack Tables
- Inertia.js
- Tailwind CSS
- Headless UI Components

## Getting Started

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js (16+) and npm/yarn
- SQLite for development

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pwman.git
cd pwman
```

2. Install PHP dependencies
```bash
composer install
```

3. Install JavaScript dependencies
```bash
npm install
```

4. Set up environment file
```bash
cp .env.example .env
php artisan key:generate
```

5. Create SQLite database
```bash
touch database/database.sqlite
```

6. Run migrations
```bash
php artisan migrate
```

7. Seed the database (optional)
```bash
php artisan db:seed
```

### Development

Run the development server:

```bash
# Run Laravel and React development servers
composer dev

# Or with SSR enabled
composer dev:ssr
```

### Building for Production

```bash
# Build frontend assets
npm run build

# Or with SSR
npm run build:ssr
```

## Project Structure

```
├── app/               # PHP application code
│   ├── Contracts/     # Interfaces
│   ├── Exceptions/    # Custom exceptions
│   ├── Http/          # Controllers, middleware, requests
│   ├── Models/        # Eloquent models
│   ├── Repositories/  # Repository pattern implementations
│   └── Services/      # Service layer
├── database/          # Migrations, factories, seeders
├── resources/         # Frontend assets and views
│   ├── css/           # Stylesheets
│   ├── js/            # React components, hooks, utilities
│   │   ├── components/ # Reusable components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── layouts/   # Layout components
│   │   ├── lib/       # Utility functions
│   │   ├── pages/     # Page components
│   │   └── types/     # TypeScript types
│   └── views/         # Blade templates
└── routes/            # API and web routes
```

## Key Features

### TanStack DataTable

The application features a highly optimized and feature-rich implementation of TanStack Tables (formerly React Table) with:

- Server-side pagination
- Sorting and filtering
- Responsive design
- Export to CSV
- Multi-select with batch operations
- Column visibility toggling

### Repository Pattern

The backend follows the repository pattern for data access:

- Clean separation of concerns
- Improved testability
- Consistent data access layer
- Standardized error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.