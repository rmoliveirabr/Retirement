from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import httpx
from typing import List, Optional
import httpx as _httpx
from datetime import datetime
from dotenv import load_dotenv
from models import Profile, ProfileCreate, ProfileUpdate, RetirementCalculation, CalculationRequest, ScenarioRequest
from retirement_calculator import RetirementCalculator
import re

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Retirement App API",
    description="A FastAPI backend for the Retirement application with profile management and calculations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React dev server and JSON server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
JSON_SERVER_URL = os.getenv("JSON_SERVER_URL", "http://localhost:3001")

# Pydantic models for API responses
class HealthResponse(BaseModel):
    status: str
    message: str
    environment: str

class WelcomeResponse(BaseModel):
    message: str
    version: str

# Dependency to get HTTP client
async def get_http_client():
    async with httpx.AsyncClient() as client:
        yield client

# Profile CRUD Operations
def camel_to_snake(obj):
    if isinstance(obj, list):
        return [camel_to_snake(i) for i in obj]
    if not isinstance(obj, dict):
        return obj
    new = {}
    for k, v in obj.items():
        # convert CamelCase or camelCase to snake_case
        new_key = re.sub(r'(?<!^)(?=[A-Z])', '_', k).lower()
        new[new_key] = camel_to_snake(v) if isinstance(v, (dict, list)) else v
    return new


def snake_to_camel(obj):
    if isinstance(obj, list):
        return [snake_to_camel(i) for i in obj]
    if not isinstance(obj, dict):
        return obj
    new = {}
    for k, v in obj.items():
        parts = k.split('_')
        new_key = parts[0] + ''.join(p.capitalize() for p in parts[1:])
        new[new_key] = snake_to_camel(v) if isinstance(v, (dict, list)) else v
    return new
@app.get("/api/profiles", response_model=List[Profile])
async def get_profiles(http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Get all profiles"""
    try:
        response = await http_client.get(f"{JSON_SERVER_URL}/profiles")
        response.raise_for_status()
        profiles = response.json()
        # convert incoming camelCase to snake_case for Pydantic validation
        return camel_to_snake(profiles)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        # Propagate the upstream status code and message when possible
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

@app.get("/api/profiles/{profile_id}", response_model=Profile)
async def get_profile(profile_id: int, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Get a specific profile by ID"""
    try:
        response = await http_client.get(f"{JSON_SERVER_URL}/profiles/{profile_id}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        response.raise_for_status()
        return camel_to_snake(response.json())
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

@app.get("/api/profiles/email/{email}", response_model=Profile)
async def get_profile_by_email(email: str, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Get a profile by email"""
    try:
        response = await http_client.get(f"{JSON_SERVER_URL}/profiles?email={email}")
        response.raise_for_status()
        profiles = response.json()
        if not profiles:
            raise HTTPException(status_code=404, detail="Profile not found")
        return camel_to_snake(profiles[0])
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

@app.post("/api/profiles", response_model=Profile)
async def create_profile(profile: ProfileCreate, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Create a new profile"""
    try:
        # Check if email already exists
        existing_response = await http_client.get(f"{JSON_SERVER_URL}/profiles?email={profile.email}")
        existing_response.raise_for_status()
        existing_profiles = existing_response.json()
        if existing_profiles:
            raise HTTPException(status_code=400, detail="Profile with this email already exists")

        # Create new profile
        # Convert profile to camelCase before sending to JSON server
        profile_data = snake_to_camel(profile.dict())
        # Persist explicit start date if provided on the profile
        if getattr(profile, 'start_date', None):
            profile_data["startDate"] = profile.start_date
        # Determine startOfRetirementYears from explicit years when provided
        if getattr(profile, 'start_of_retirement_years', None) is not None:
            profile_data["startOfRetirementYears"] = int(profile.start_of_retirement_years)
        else:
            profile_data["startOfRetirementYears"] = 0

        # Ensure timestamps are set server-side so createdAt/updatedAt are always present
        now = datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
        profile_data["createdAt"] = now
        profile_data["updatedAt"] = now

        response = await http_client.post(f"{JSON_SERVER_URL}/profiles", json=profile_data)
        response.raise_for_status()
        # Convert created profile back to snake_case for API response
        return camel_to_snake(response.json())
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

@app.put("/api/profiles/{profile_id}", response_model=Profile)
async def update_profile(profile_id: int, profile_update: ProfileUpdate, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Update an existing profile"""
    try:
        # Get existing profile
        existing_response = await http_client.get(f"{JSON_SERVER_URL}/profiles/{profile_id}")
        if existing_response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        existing_response.raise_for_status()
        existing_profile = camel_to_snake(existing_response.json())

        # Update profile data
        update_data = profile_update.dict(exclude_unset=True)

        # Convert update_data to camelCase for JSON server
        update_payload = snake_to_camel(update_data)

        # If the user updated start_date, ensure camelCase key is present
        if "start_date" in update_data:
            sd = update_data.get("start_date")
            if sd is not None:
                update_payload["startDate"] = sd

        # If the user updated start_of_retirement_years, ensure the camelCase key is present and an int
        if "start_of_retirement_years" in update_data:
            siy = update_data.get("start_of_retirement_years")
            if siy is not None:
                try:
                    update_payload["startOfRetirementYears"] = int(siy)
                except Exception:
                    # leave existing value unchanged on failure
                    pass

        # Always set an updatedAt timestamp when modifying a profile
        now = datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
        update_payload["updatedAt"] = now

        # Use PATCH to avoid replacing the whole resource when partial updates are provided
        response = await http_client.patch(f"{JSON_SERVER_URL}/profiles/{profile_id}", json=update_payload)
        response.raise_for_status()
        return camel_to_snake(response.json())
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

@app.delete("/api/profiles/{profile_id}")
async def delete_profile(profile_id: int, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Delete a profile"""
    try:
        response = await http_client.delete(f"{JSON_SERVER_URL}/profiles/{profile_id}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        response.raise_for_status()
        return {"message": "Profile deleted successfully"}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

@app.post("/api/profiles/{profile_id}/clone")
async def clone_profile(profile_id: int, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Clone a profile with all fields except email (which must be provided when creating the new profile)"""
    try:
        # Get existing profile
        existing_response = await http_client.get(f"{JSON_SERVER_URL}/profiles/{profile_id}")
        if existing_response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        existing_response.raise_for_status()
        existing_profile_data = camel_to_snake(existing_response.json())

        # Create Profile object to validate the data
        existing_profile = Profile(**existing_profile_data)
        
        # Return cloned data as a dict with empty email
        # Email will be empty string and must be filled by the user
        cloned_data = {
            "email": "",  # Empty email - user must provide a new one
            "base_age": existing_profile.base_age,
            "start_date": getattr(existing_profile, 'start_date', None),
            "total_assets": existing_profile.total_assets,
            "fixed_assets": existing_profile.fixed_assets,
            "monthly_salary_net": existing_profile.monthly_salary_net,
            "government_retirement_income": existing_profile.government_retirement_income,
            "monthly_return_rate": existing_profile.monthly_return_rate,
            "fixed_assets_growth_rate": getattr(existing_profile, 'fixed_assets_growth_rate', 0.04),
            "investment_tax_rate": existing_profile.investment_tax_rate,
            "investment_taxable_percentage": getattr(existing_profile, 'investment_taxable_percentage', 1.0),
            "end_of_salary_years": existing_profile.end_of_salary_years,
            "government_retirement_start_years": existing_profile.government_retirement_start_years,
            "government_retirement_adjustment": existing_profile.government_retirement_adjustment,
            "monthly_expense_recurring": existing_profile.monthly_expense_recurring,
            "rent": existing_profile.rent,
            "one_time_annual_expense": existing_profile.one_time_annual_expense,
            "annual_inflation": existing_profile.annual_inflation,
        }
        
        return cloned_data
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")
    except _httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 502
        detail = f"Upstream server returned status {status}: {e.response.text if e.response is not None else str(e)}"
        raise HTTPException(status_code=status, detail=detail)

# Retirement Calculation Endpoints
@app.post("/api/retirement/calculate", response_model=RetirementCalculation)
async def calculate_retirement(request: CalculationRequest, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Calculate retirement projections for a profile"""
    try:
        # Get profile
        profile_response = await http_client.get(f"{JSON_SERVER_URL}/profiles/{request.profile_id}")
        if profile_response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile_response.raise_for_status()
        profile_data = camel_to_snake(profile_response.json())

        # Create Profile object
        profile = Profile(**profile_data)
        
        # Calculate retirement
        calculation = RetirementCalculator.calculate_retirement(
            profile,
            request.expected_return_rate,
            request.retirement_duration_years,
            getattr(request, 'target_age', 100)
        )
        
        # Update profile with last calculation
        await http_client.patch(
            f"{JSON_SERVER_URL}/profiles/{request.profile_id}",
            json={"lastCalculation": calculation.calculation_date.isoformat()}
        )
        
        return calculation
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

@app.get("/api/retirement/readiness/{profile_id}")
async def get_retirement_readiness(profile_id: int, expected_return_rate: float = 0.07, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Get retirement readiness analysis for a profile"""
    try:
        # Get profile
        profile_response = await http_client.get(f"{JSON_SERVER_URL}/profiles/{profile_id}")
        if profile_response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile_response.raise_for_status()
        profile_data = camel_to_snake(profile_response.json())

        # Create Profile object
        profile = Profile(**profile_data)
        
        # Calculate readiness
        readiness = RetirementCalculator.calculate_retirement_readiness(profile, expected_return_rate)
        
        return readiness
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

@app.post("/api/retirement/scenario", response_model=RetirementCalculation)
async def calculate_scenario(request: ScenarioRequest, http_client: httpx.AsyncClient = Depends(get_http_client)):
    """Calculate retirement projections with optional profile overrides (does not modify the profile)"""
    try:
        # Get profile
        profile_response = await http_client.get(f"{JSON_SERVER_URL}/profiles/{request.profile_id}")
        if profile_response.status_code == 404:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile_response.raise_for_status()
        profile_data = camel_to_snake(profile_response.json())

        # Apply scenario overrides to profile data
        overrides = request.dict(exclude={'profile_id', 'expected_return_rate', 'retirement_duration_years', 'target_age'}, exclude_none=True)
        profile_data.update(overrides)

        # Create Profile object with overridden values
        profile = Profile(**profile_data)
        
        # Calculate retirement with scenario parameters
        calculation = RetirementCalculator.calculate_retirement(
            profile,
            request.expected_return_rate,
            request.retirement_duration_years,
            getattr(request, 'target_age', 100)
        )
        
        # Note: We do NOT update the profile's last_calculation since this is a scenario
        
        return calculation
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

# Basic API Routes
@app.get("/", response_model=WelcomeResponse)
async def root():
    return WelcomeResponse(
        message="Welcome to the Retirement App API",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message="API is running successfully",
        environment=os.getenv("ENVIRONMENT", "development")
    )

@app.get("/api/retirement/status")
async def get_retirement_status():
    return {
        "status": "active",
        "message": "Retirement planning service is available"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
