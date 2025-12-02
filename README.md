# Retirement Planning Application

> **🚀 Backend Migration Complete!** The backend has been refactored from FastAPI (Python) to **NestJS (TypeScript)** for a standardized, type-safe stack. See [NESTJS_MIGRATION.md](NESTJS_MIGRATION.md) for details.

A comprehensive full-stack application for retirement planning with profile management, calculations, and analysis. Built with NestJS TypeScript backend, React TypeScript frontend, and JSON Server database.

## Project Structure

```
Retirement/
├── backend-nestjs/
│   ├── src/
│   │   ├── profiles/              # Profile CRUD module
│   │   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── entities/          # Profile entity
│   │   │   ├── profiles.controller.ts
│   │   │   ├── profiles.service.ts
│   │   │   └── profiles.module.ts
│   │   ├── retirement/            # Retirement calculations module
│   │   │   ├── dto/               # Calculation DTOs
│   │   │   ├── retirement-calculator.service.ts
│   │   │   ├── retirement.controller.ts
│   │   │   └── retirement.module.ts
│   │   ├── ai/                    # AI assistant module
│   │   │   ├── dto/               # AI request DTOs
│   │   │   ├── ai.service.ts
│   │   │   ├── ai.controller.ts
│   │   │   └── ai.module.ts
│   │   ├── app.module.ts          # Main application module
│   │   └── main.ts                # Application entry point
│   ├── Dockerfile                 # Production Docker configuration
│   ├── Dockerfile.dev             # Development Docker configuration
│   ├── package.json               # Node.js dependencies
│   └── tsconfig.json              # TypeScript configuration
├── frontend/
│   ├── public/
│   │   └── index.html             # HTML template
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── ProfileForm.tsx    # Profile creation/editing form
│   │   │   ├── ProfileList.tsx    # Profile listing component
│   │   │   └── RetirementResults.tsx # Calculation results display
│   │   ├── services/
│   │   │   └── api.ts             # API service layer
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── App.tsx                # Main React component
│   │   ├── App.css                # Styles
│   │   ├── index.tsx              # React entry point
│   │   └── index.css              # Global styles
│   ├── package.json               # Node.js dependencies
│   └── tsconfig.json              # TypeScript configuration
├── database/
│   ├── db.json                    # JSON Server database
│   ├── package.json               # JSON Server dependencies
│   └── middleware.js              # JSON Server middleware
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Git

### Database Setup (JSON Server)

1. Navigate to the database directory:
   ```bash
   cd database
   ```

2. Install JSON Server:
   ```bash
   npm install
   ```

3. Start the JSON Server:
   ```bash
   npm start
   ```

The database will be available at `http://localhost:3001`

### Backend Setup (NestJS)

1. Navigate to the backend directory:
   ```bash
   cd backend-nestjs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration (especially `OPENAI_API_KEY`)

5. Run the NestJS server:
   ```bash
   npm run start:dev
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Features

### Backend (NestJS + TypeScript)
- **Profile Management**: Complete CRUD operations for user profiles
- **Retirement Calculations**: Advanced retirement planning algorithms
- **Data Validation**: Comprehensive input validation with class-validator
- **API Documentation**: Auto-generated Swagger/OpenAPI docs (coming soon)
- **Error Handling**: Robust error handling and HTTP status codes
- **AI Assistant**: Context-aware financial advice using OpenAI (GPT-4) with MongoDB caching
- **CORS Configuration**: Cross-origin resource sharing setup
- **Modular Architecture**: Clean separation of concerns with NestJS modules
- **Type Safety**: Full TypeScript implementation for reliability
- **AI Caching**: Intelligent caching system for AI responses (2-month TTL)

### Frontend (React + TypeScript)
- **Profile Management**: Create, edit, delete, and view profiles
- **Retirement Analysis**: Calculate and display retirement projections
- **Readiness Assessment**: Retirement readiness scoring and recommendations
- **Responsive Design**: Mobile-friendly interface with CSS Grid/Flexbox
- **Form Validation**: Client-side validation with error handling
- **Modern UI**: Beautiful gradients, animations, and interactive components
- **Modern UI**: Beautiful gradients, animations, and interactive components
- **AI Chat Interface**: Interactive chat for personalized financial advice
- **Smart Field Guidance**: AI-powered information buttons for complex fields with caching and static fallback

### Database (MongoDB)
- **NoSQL Database**: Scalable document storage with MongoDB
- **Mongoose ODM**: Elegant object modeling for Node.js
- **Cloud Ready**: Configured for MongoDB Atlas
- **Caching**: Dedicated collection for AI response caching

## API Endpoints

### Profile Management
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/{id}` - Get profile by ID
- `GET /api/profiles/email/{email}` - Get profile by email
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/{id}` - Update profile
- `DELETE /api/profiles/{id}` - Delete profile

### Retirement Calculations
- `POST /api/retirement/calculate` - Calculate retirement projections
- `GET /api/retirement/readiness/{id}` - Get retirement readiness analysis

### System
- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/retirement/status` - Retirement service status

## Profile Data Structure

Each profile contains:
- **Personal Info**: Email, current age
- **Financial Assets**: Total assets, fixed assets, current retirement fund
- **Income & Taxes**: Monthly income, net salary, tax rates
- **Timeline**: Years until salary ends, years until retirement
- **Expenses**: Monthly recurring expenses, rent, annual expenses
- **Assumptions**: Retirement adjustment rate, inflation rate

## Retirement Calculations

The application provides:
- **Future Value Calculations**: Projected retirement fund value
- **Monthly Income Projections**: Expected retirement income
- **Readiness Scoring**: 0-100 score based on savings rate and assets
- **Recommendations**: Personalized advice for improvement
- **Scenario Analysis**: Different return rate assumptions

## Technologies Used

### Backend
- **Node.js 20+**: Runtime environment
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe JavaScript
- **class-validator**: Data validation and transformation
- **Axios**: HTTP client for JSON Server communication
- **OpenAI SDK**: AI assistant integration

### Frontend
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Axios**: HTTP client for API calls
- **CSS3**: Modern styling with Grid and Flexbox

### Database
- **MongoDB**: NoSQL database
- **Mongoose**: ODM library
- **MongoDB Atlas**: Cloud database service

## Development Workflow

1. **Start JSON Server**: `cd database && npm start`
2. **Start Backend**: `cd backend-nestjs && npm run start:dev`
3. **Start Frontend**: `cd frontend && npm start`
4. **Access Application**: Open `http://localhost:3000`

## Configuration

### Environment Variables
- `ENVIRONMENT`: development/production
- `JSON_SERVER_URL`: JSON Server endpoint
- `DEBUG`: Enable debug mode
- `CORS_ORIGINS`: Allowed origins for CORS
- `OPENAI_API_KEY`: Your OpenAI API Key (required for AI Assistant)
- `OPENAI_MODEL`: OpenAI Model to use (default: gpt-4-turbo)

> **Note:** Copy `.env.example` to `.env` in the `backend` directory and fill in your values.

### JSON Server
- Database file: `database/db.json`
- Port: 3001
- Middleware: Automatic timestamps

## Recent Improvements (v2.0 - Oct 2025)

### Critical Fixes Implemented ✅

Six major issues have been identified and fixed:

1. **Total Retirement Fund Tracking** - Now correctly shows fund value at retirement start
2. **Safe Withdrawal Rate Mismatch** - Display matches simulation
3. **Fixed Assets Integration** - Added growth tracking for real estate/fixed assets
4. **Rate Field Naming** - Renamed `monthly_investment_rate` to `monthly_return_rate` for clarity
5. **Input Validations** - Added comprehensive validation rules
6. **Readiness Score** - Improved formula with meaningful component weights

### Testing

A comprehensive test suite with 15 tests covering all fixes:

```bash
cd backend
.venv/bin/python -m pytest test_retirement_calculator.py -v
```

**Test Results:** ✅ 15/15 passing

### Migration Required

If upgrading from v1.0, update your database field names:
- `monthlyInvestmentRate` → `monthlyReturnRate`
- Add new field: `fixedAssetsGrowthRate` (default: 0.04)

See [FIXES_SUMMARY.md](FIXES_SUMMARY.md) for complete migration guide.

---

## 🐳 Docker Deployment

The application is fully Dockerized with separate containers for Frontend, Backend, and Database!

### Quick Start with Docker

```bash
# Interactive setup (recommended)
./docker-start.sh

# Or using Make commands
make setup
make up

# Or using Docker Compose directly
docker compose up --build -d
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: http://localhost:3001

### Docker Features
✅ Production-optimized builds with multi-stage Dockerfiles  
✅ Development mode with hot reload  
✅ Health checks for all services  
✅ Automated dependency management  
✅ Data persistence with volume mounts  
✅ Security best practices (non-root users, minimal images)  
✅ Convenient Make commands and interactive scripts  

### Documentation
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Quick setup summary
- **[DOCKER.md](DOCKER.md)** - Complete Docker guide with troubleshooting

### Common Commands
```bash
make help           # Show all available commands
make up             # Start production services
make dev-up         # Start development services with hot reload
make logs           # View logs
make backup         # Backup database
make health         # Check service health
make clean          # Clean up Docker resources
```

---

## Next Steps

This application provides a solid foundation for retirement planning. Potential enhancements:

- ✅ **Docker Deployment**: Fully implemented with production and development modes
- ✅ **Authentication**: User login and session management (implemented)
- ✅ **Authentication**: User login and session management (implemented)
- ✅ **Real Database**: MongoDB integration complete
- ✅ **AI Field Guidance**: Context-aware help with caching
- **Advanced Calculations**: Monte Carlo simulations, tax optimization
- **Data Visualization**: Charts and graphs for projections
- **Export Features**: PDF reports, Excel exports
- **Mobile App**: React Native version
- **Testing**: Unit and integration tests
- **Cloud Hosting**: AWS, GCP, or Azure deployment
