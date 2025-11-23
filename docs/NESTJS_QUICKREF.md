# NestJS Backend - Quick Reference

## 🚀 Quick Start

```bash
# Navigate to backend
cd backend-nestjs

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run start:dev
```

Server runs on: `http://localhost:8000`

## 📋 Common Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger

# Production
npm run build              # Build for production
npm run start:prod         # Run production build

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier

# Testing
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
```

## 🐳 Docker Commands

```bash
# Production
docker compose up --build                    # Build and start all services
docker compose down                          # Stop all services
docker compose logs backend                  # View backend logs

# Development (with hot reload)
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml down
```

## 🔌 API Endpoints

### Health & Status
- `GET /` - Welcome message
- `GET /health` - Health check

### Profiles
- `GET /api/profiles` - List all profiles
- `GET /api/profiles/:id` - Get profile by ID
- `GET /api/profiles/email/:email` - Get profile by email
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile
- `GET /api/profiles/:id/clone` - Clone profile

### Retirement Calculations
- `POST /api/retirement/calculate` - Calculate retirement
- `GET /api/retirement/readiness/:id` - Get readiness score
- `POST /api/retirement/scenario` - Calculate scenario
- `GET /api/retirement/status` - Service status

### AI Assistant
- `POST /api/ai/ask` - Ask AI assistant

## 🔧 Environment Variables

Required in `.env`:

```env
# Server
PORT=8000
ENVIRONMENT=development

# Database
JSON_SERVER_URL=http://localhost:3001

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:80

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# Debug
DEBUG=true
```

## 📁 Project Structure

```
src/
├── profiles/           # Profile CRUD
├── retirement/         # Calculations
├── ai/                 # AI assistant
├── app.module.ts       # Root module
└── main.ts             # Entry point
```

## 🧪 Testing the API

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Get all profiles
curl http://localhost:8000/api/profiles

# Create profile
curl -X POST http://localhost:8000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "baseAge": 30,
    "totalAssets": 100000,
    "fixedAssets": 50000,
    "monthlySalaryNet": 5000,
    "governmentRetirementIncome": 2000,
    "monthlyReturnRate": 0.005,
    "fixedAssetsGrowthRate": 0.04,
    "investmentTaxRate": 0.15,
    "investmentTaxablePercentage": 1.0,
    "endOfSalaryYears": 30,
    "governmentRetirementStartYears": 35,
    "governmentRetirementAdjustment": 0.02,
    "monthlyExpenseRecurring": 3000,
    "rent": 1000,
    "oneTimeAnnualExpense": 5000,
    "annualInflation": 0.03
  }'
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Check if JSON Server is running
curl http://localhost:3001

# Check environment variables
cat .env
```

### Build errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Docker issues
```bash
# Clean Docker resources
docker compose down -v
docker system prune -f

# Rebuild from scratch
docker compose up --build --force-recreate
```

## 📊 Logs

Development logs show:
- Route mappings
- Request/response details
- Error stack traces

Production logs are minimal for performance.

## 🔐 Security Notes

- Non-root user in Docker
- Input validation on all endpoints
- CORS properly configured
- Environment variables for secrets
- No sensitive data in logs

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [class-validator](https://github.com/typestack/class-validator)
- [OpenAI API](https://platform.openai.com/docs)

## 🆘 Need Help?

1. Check `NESTJS_MIGRATION.md` for detailed migration info
2. Check `REFACTORING_SUMMARY.md` for complete feature list
3. Review the code - it's well-commented!
4. Check NestJS documentation

---

**Version**: 2.0  
**Last Updated**: November 23, 2025
