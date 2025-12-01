## To Fix

## Pending
- **Improve UI**: Give tips for users when filling profile data
- **Advanced Calculations**: Monte Carlo simulations, tax optimization
- **Data Visualization**: Charts and graphs for projections
- **Export Features**: PDF reports, Excel exports
- **Mobile App**: React Native version
- **Testing**: Unit and integration tests
- **Deployment**: Cloud hosting

## Done
- **Profile Update Fix** (Dec 1, 2025): Fixed 403 Forbidden error by correctly handling ObjectId vs String comparison in ownership checks
- **Profile Caching Fix** (Dec 1, 2025): Fixed issue where profiles persisted after logout/user switch by adding user dependency to data fetching effect
- **Authentication** (Dec 1, 2025): Complete user authentication system with email/password, JWT tokens, password reset, admin features, and multiple profiles per user
- **Calculation Fixes** (Nov 24, 2025):
  - Fixed year numbering to start from 1 instead of 2
  - Fixed age display in timeline
  - Fixed period dates to use retirement start month/year
  - Allow negative final values to show funding gaps (displayed in red)
  - Stop timeline when funds are depleted (currentValue <= 0)
- **Fund Depletion Calculation Fix**: Fixed bug where Year #21 showed R$ 0,00 incorrectly. Now properly clamps final value to 0 when funds are depleted and stops timeline at the depletion year (Nov 24, 2025)
- **Prepare for Hosting**: Dockerize all three components (Frontend, Backend, and json-server) into separate containers, then use Docker Compose to manage them.
- **Backend Refactoring**: Migrated backend from FastAPI (Python) to NestJS (TypeScript) for standardized stack with improved type safety and maintainability (Nov 23, 2025)
- See how to deploy to Vercel
- In my test, the "Data de Início da Aposentadoria" is 01/01/2026, but the "Período" starts with 12-2025, and it should be from 01-2026 to 01-2027 for year 1 
- Test solutions (negative numbers, timeline stop in simulation)
- When I ask to calculate, I see a message about "carregando perfis" (profiles) while it's loading, but it should be "calculando" (calculating)
- **Real Database**: PostgreSQL or MongoDB integration
- For a numeric field, when I clear the text field content, it replaces by zero... but when I start typing a number, it should remove the zero, but it keeps it (I can't delete the zero)
- you can set a numeric field to zero when it loses focus and is empty
