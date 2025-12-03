## To Fix
- see how to show 'Ativos fixos', and allow it to be used as a backup for 'Ativos totais'
- Review the healthyness of the profile using AI (cache and update only when the profile is changed)
- Review "Projeções de Aposentadoria"

## Pending
- **Advanced Calculations**: Monte Carlo simulations, tax optimization
- **Data Visualization**: Charts and graphs for projections
- **Export Features**: PDF reports, Excel exports
- **Mobile App**: React Native version
- **Testing**: Unit and integration tests
- **Deployment**: Cloud hosting

## Done
- **Salary Calculation Fix** (Dec 3, 2025): Fixed "Renda Total (Salário)" calculation that was including one extra month. Changed comparison from `<=` to `<` to exclude the end month.
- **Scenario Simulation Fix** (Dec 2, 2025): Fixed issue where changing "Data de Início da Aposentadoria" in the simulator didn't update the calculation or row colors. Added `startDate` to the scenario request payload.
- **Scenario Simulator Enhancement** (Dec 2, 2025): Added "Data de Início da Aposentadoria" field to scenario simulator with MM/YYYY format support.
- **Government Retirement Calculation Fix** (Dec 2, 2025): "Anos para aposentadoria do governo" now counts from current year instead of retirement start date.
- **Partial Year 1 Support** (Dec 2, 2025): Year 1 now spans from current month to retirement start month (partial year). Subsequent years align to retirement anniversary for consistent tracking.
- **Date Format Update** (Dec 2, 2025): Changed "Data de Início da Aposentadoria" to use MM/AAAA format for better user experience.
- **Timeline Calculations** (Dec 2, 2025): Timeline now starts from current year instead of retirement year, showing pre-retirement accumulation period with proper inflation/growth projections. Pre-retirement rows are visually distinguished with faded styling.
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
- Show info about some key fields in the profile form (start with aposentadoria). Cache this data in the backend, to avoid several calls to AI, with a TTL of 2 months, and in the modal showing the information, have a little "reload" button to make the call again.
- fix alignment between field title and the 'i' for information
- Mudar número de anos para salário e aposentadoria para MM/YYYY
