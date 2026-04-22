/**
 * API Configuration
 * Centralized API endpoint management
 */

// Determine API base URL based on environment
const getApiBase = () => {
  // Check environment variables first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }

  // Production (update with your domain)
  return "https://api.tradetrack.com";
};

export const API_BASE = getApiBase();

// API endpoints
export const API_ENDPOINTS = {
  ROOT: "/",
  HEALTH: "/health",
  MODELS: "/models",
  STOCK: (symbol) => `/stock/${symbol}`,
  SEARCH: (query) => `/search/${query}`,
  PREDICT: (symbol) => `/predict/${symbol}`,
};

/**
 * Make API request with error handling
 */
export const apiFetch = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE}${endpoint}`;

    const fetchOptions = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchOptions.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, fetchOptions);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

/**
 * Get stock data
 */
export const getStockData = async (symbol) => {
  return apiFetch(API_ENDPOINTS.STOCK(symbol));
};

/**
 * Get predictions
 */
export const getPrediction = async (symbol, days = 7, model = "lstm") => {
  return apiFetch(
    `${API_ENDPOINTS.PREDICT(symbol)}?days=${days}&model_id=${model}`
  );
};

/**
 * Search stocks
 */
export const searchStocks = async (query) => {
  return apiFetch(API_ENDPOINTS.SEARCH(query));
};

/**
 * Get available models
 */
export const getModels = async () => {
  return apiFetch(API_ENDPOINTS.MODELS);
};
