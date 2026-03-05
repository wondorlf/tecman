# TecMan - Enterprise Inventory Management System

Sistema integral para gestión de inventario tecnológico y biomédico con CMMS/ITAM/EAM moderno.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MariaDB >= 10.6
- npm >= 10

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development
npm run dev
```

### Available Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start all apps in development mode |
| `npm run build`      | Build all apps for production      |
| `npm run start`      | Start all apps in production mode  |
| `npm run db:migrate` | Run database migrations            |
| `npm run db:seed`    | Seed initial data                  |

## 📁 Project Structure

```
egan-tecman/
├── apps/
│   ├── backend/    # NestJS API + AdminJS
│   └── frontend/   # Next.js App (PWA)
├── packages/
│   └── shared/     # Shared types and utilities
└── prisma/         # Database schema
```

## 🔐 Default Credentials

After seeding, use:

- **Email:** admin@tecman.local
- **Password:** admin123

## 📖 Documentation

- [API Documentation](http://localhost:3001/api/docs)
- [Admin Panel](http://localhost:3001/admin)
- [Frontend App](http://localhost:3000)

## 📄 License

Proprietary - EGAN Technologies
