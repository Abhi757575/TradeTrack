"""
JWT Authentication Module for TradeTrack API
Secure API endpoints with token-based authentication
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
import os

# ══════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ══════════════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════════════

class User(BaseModel):
    """User model"""
    id: str
    username: str
    email: str
    is_active: bool = True
    is_premium: bool = False

class UserInDB(User):
    """User in database with hashed password"""
    hashed_password: str

class Token(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    username: str
    exp: datetime
    iat: datetime
    is_premium: bool = False

class LoginRequest(BaseModel):
    """Login request"""
    username: str
    password: str

class RegisterRequest(BaseModel):
    """Registration request"""
    username: str
    email: str
    password: str

# ══════════════════════════════════════════════════════════════
# UTILITIES
# ══════════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    import bcrypt
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(
    user_id: str,
    username: str,
    is_premium: bool = False,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "user_id": user_id,
        "username": username,
        "is_premium": is_premium,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token"""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "user_id": user_id,
        "type": "refresh",
        "exp": expire,
    }
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ══════════════════════════════════════════════════════════════

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security)
) -> TokenData:
    """
    Verify JWT token and return current user
    Usage: @app.get("/protected")
           def protected_route(user: TokenData = Depends(get_current_user)):
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        username: str = payload.get("username")
        is_premium: bool = payload.get("is_premium", False)
        
        if user_id is None or username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenData(
            user_id=user_id,
            username=username,
            is_premium=is_premium,
            exp=datetime.fromtimestamp(payload.get("exp")),
            iat=datetime.fromtimestamp(payload.get("iat"))
        )
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_premium_user(
    user: TokenData = Depends(get_current_user)
) -> TokenData:
    """Verify user has premium subscription"""
    if not user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a premium subscription"
        )
    return user

# ══════════════════════════════════════════════════════════════
# ENDPOINTS (ADD TO main_integrated.py)
# ══════════════════════════════════════════════════════════════

"""
# Add these imports to main_integrated.py
from auth import (
    get_current_user,
    get_premium_user,
    create_access_token,
    create_refresh_token,
    verify_password,
    hash_password,
    LoginRequest,
    RegisterRequest,
    Token,
    TokenData,
)

# Add these endpoints to main_integrated.py

@app.post("/auth/register", response_model=Token)
def register(request: RegisterRequest):
    '''Register new user'''
    # TODO: Check if user exists in database
    # TODO: Hash password
    # TODO: Save user to database
    
    user_id = "user_123"  # Generated from database
    access_token = create_access_token(user_id, request.username)
    refresh_token = create_refresh_token(user_id)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.post("/auth/login", response_model=Token)
def login(request: LoginRequest):
    '''Login user and return tokens'''
    # TODO: Get user from database
    # TODO: Verify password
    
    # Example
    user_id = "user_123"
    is_premium = False
    
    access_token = create_access_token(user_id, request.username, is_premium)
    refresh_token = create_refresh_token(user_id)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.post("/auth/refresh", response_model=Token)
def refresh_token(credentials: HTTPAuthCredentials = Depends(security)):
    '''Refresh access token using refresh token'''
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("user_id")
        # TODO: Get user from database
        
        access_token = create_access_token(user_id, "username")
        
        return Token(
            access_token=access_token,
            refresh_token=token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/auth/me")
def get_me(user: TokenData = Depends(get_current_user)):
    '''Get current user info'''
    return {
        "user_id": user.user_id,
        "username": user.username,
        "is_premium": user.is_premium,
        "token_expires": user.exp
    }

# Protected endpoints
@app.get("/stock/{symbol}")
def get_stock(symbol: str, user: TokenData = Depends(get_current_user)):
    '''Get stock data (requires authentication)'''
    # Existing implementation
    pass

@app.post("/predict/{symbol}")
def predict_stock(
    symbol: str,
    days: int = 7,
    model: str = "lstm",
    user: TokenData = Depends(get_current_user)
):
    '''Generate prediction (requires authentication)'''
    # Existing implementation
    pass

@app.get("/premium-features")
def premium_features(user: TokenData = Depends(get_premium_user)):
    '''Premium only features'''
    return {
        "backtesting": True,
        "portfolio_tracking": True,
        "advanced_analytics": True,
        "api_access": True
    }
"""

# ══════════════════════════════════════════════════════════════
# USAGE EXAMPLES
# ══════════════════════════════════════════════════════════════

"""
# EXAMPLE 1: Register User
POST /auth/register
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password_123"
}

Response:
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 1800
}


# EXAMPLE 2: Login User
POST /auth/login
Content-Type: application/json

{
    "username": "john_doe",
    "password": "secure_password_123"
}

Response: (same as register)


# EXAMPLE 3: Use Access Token
GET /stock/AAPL
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

Response: (stock data)


# EXAMPLE 4: Refresh Token
POST /auth/refresh
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc... (refresh token)

Response: (new access token)


# EXAMPLE 5: Get Premium Features
GET /premium-features
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

Response:
{
    "backtesting": true,
    "portfolio_tracking": true,
    "advanced_analytics": true,
    "api_access": true
}
"""

# ══════════════════════════════════════════════════════════════
# FRONTEND USAGE
# ══════════════════════════════════════════════════════════════

"""
// React Example

import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const authApi = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });
        
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return authApi(originalRequest);
      } catch (err) {
        // Redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Login function
const login = async (username, password) => {
  try {
    const response = await authApi.post('/auth/login', {
      username,
      password
    });
    
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};

// Get protected data
const getPrediction = async (symbol, days, model) => {
  try {
    const response = await authApi.post(
      `/predict/${symbol}?days=${days}&model=${model}`
    );
    return response.data;
  } catch (error) {
    console.error('Prediction failed:', error);
    return null;
  }
};

export { authApi, login, getPrediction };
"""

# ══════════════════════════════════════════════════════════════
# PRODUCTION SECURITY NOTES
# ══════════════════════════════════════════════════════════════

"""
1. SECRETS MANAGEMENT
   - Store SECRET_KEY in environment variables
   - Use AWS Secrets Manager or similar
   - Never commit secrets to git
   
2. PASSWORD HASHING
   - Use bcrypt with salt rounds >= 12
   - Never store plain passwords
   - Verify with constant-time comparison
   
3. TOKEN EXPIRATION
   - Short-lived access tokens (15-30 minutes)
   - Longer-lived refresh tokens (7 days)
   - Implement token blacklist for logout
   
4. HTTPS ONLY
   - Use HTTPS in production
   - Set Secure and HttpOnly flags on cookies
   - Implement HSTS headers
   
5. RATE LIMITING
   - Limit login attempts (5 per minute)
   - Limit API requests (100 per minute per user)
   - Implement CAPTCHA for repeated failures
   
6. MONITORING
   - Log all authentication attempts
   - Monitor for suspicious patterns
   - Set up alerts for security events
"""
