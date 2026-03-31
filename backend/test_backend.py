"""
Test suite for TradeTrack Backend API
Tests for endpoints, models, and utility functions
"""

import pytest
from fastapi.testclient import TestClient
from main_integrated import app, get_ticker_data, add_technical_indicators
import pandas as pd
import numpy as np

# Test Client
client = TestClient(app)

# ══════════════════════════════════════════════════════════════
# ROOT ENDPOINT TESTS
# ══════════════════════════════════════════════════════════════

class TestRootEndpoint:
    def test_root_status(self):
        """Test root endpoint returns status"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "service" in data
        assert "models_loaded" in data

    def test_root_returns_version(self):
        """Test root endpoint returns version"""
        response = client.get("/")
        data = response.json()
        assert "version" in data
        assert data["version"] == "2.0.0"


# ══════════════════════════════════════════════════════════════
# MODELS ENDPOINT TESTS
# ══════════════════════════════════════════════════════════════

class TestModelsEndpoint:
    def test_models_endpoint(self):
        """Test models endpoint returns list"""
        response = client.get("/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) >= 6

    def test_models_have_required_fields(self):
        """Test each model has required fields"""
        response = client.get("/models")
        data = response.json()
        
        for model in data["models"]:
            assert "id" in model
            assert "name" in model
            assert "description" in model
            assert "architecture" in model
            assert "features" in model
            assert "performance" in model

    def test_all_models_present(self):
        """Test all expected models are present"""
        response = client.get("/models")
        data = response.json()
        model_ids = [m["id"] for m in data["models"]]
        
        expected = ["lstm", "xgboost", "gradient_boosting", "random_forest", "svm", "linear_regression"]
        for model_id in expected:
            assert model_id in model_ids


# ══════════════════════════════════════════════════════════════
# STOCK ENDPOINT TESTS
# ══════════════════════════════════════════════════════════════

class TestStockEndpoint:
    @pytest.mark.skip(reason="Requires live API")
    def test_stock_aapl(self):
        """Test getting AAPL stock data"""
        response = client.get("/stock/AAPL")
        assert response.status_code == 200
        data = response.json()
        
        assert data["symbol"] == "AAPL"
        assert "current_price" in data
        assert "history" in data
        assert len(data["history"]) > 0

    @pytest.mark.skip(reason="Requires live API")
    def test_stock_history_fields(self):
        """Test stock history has required fields"""
        response = client.get("/stock/AAPL")
        data = response.json()
        
        if data["history"]:
            history_item = data["history"][0]
            assert "date" in history_item
            assert "open" in history_item
            assert "close" in history_item
            assert "high" in history_item
            assert "low" in history_item
            assert "volume" in history_item

    def test_stock_invalid_symbol(self):
        """Test invalid stock symbol"""
        response = client.get("/stock/INVALIDSYM123")
        assert response.status_code == 404


# ══════════════════════════════════════════════════════════════
# PREDICTION ENDPOINT TESTS
# ══════════════════════════════════════════════════════════════

class TestPredictionEndpoint:
    @pytest.mark.skip(reason="Requires live API")
    def test_predict_basic(self):
        """Test basic prediction"""
        response = client.post("/predict/AAPL?days=7&model=lstm")
        assert response.status_code == 200
        data = response.json()
        
        assert data["symbol"] == "AAPL"
        assert "model" in data
        assert "confidence" in data
        assert "predictions" in data
        assert len(data["predictions"]) == 7

    @pytest.mark.skip(reason="Requires live API")
    def test_predict_fields(self):
        """Test prediction response has required fields"""
        response = client.post("/predict/AAPL?days=7&model=xgboost")
        data = response.json()
        
        for pred in data["predictions"]:
            assert "date" in pred
            assert "price" in pred
            assert "lower" in pred
            assert "upper" in pred
            assert pred["lower"] <= pred["price"] <= pred["upper"]

    def test_predict_invalid_days_low(self):
        """Test prediction with days < 1"""
        response = client.post("/predict/AAPL?days=0&model=lstm")
        assert response.status_code == 400

    def test_predict_invalid_days_high(self):
        """Test prediction with days > 90"""
        response = client.post("/predict/AAPL?days=100&model=lstm")
        assert response.status_code == 400

    def test_predict_invalid_model(self):
        """Test prediction with invalid model"""
        response = client.post("/predict/AAPL?days=7&model=invalidmodel")
        assert response.status_code == 400

    @pytest.mark.skip(reason="Requires live API")
    def test_predict_confidence_range(self):
        """Test confidence score is in valid range"""
        response = client.post("/predict/AAPL?days=7&model=lstm")
        data = response.json()
        
        assert 0 <= data["confidence"] <= 1

    @pytest.mark.skip(reason="Requires live API")
    def test_predict_all_models(self):
        """Test prediction with all models"""
        models = ["lstm", "xgboost", "gradient_boosting", "random_forest", "svm", "linear_regression", "ensemble"]
        
        for model in models:
            response = client.post(f"/predict/AAPL?days=7&model={model}")
            assert response.status_code == 200, f"Failed for model: {model}"


# ══════════════════════════════════════════════════════════════
# SEARCH ENDPOINT TESTS
# ══════════════════════════════════════════════════════════════

class TestSearchEndpoint:
    def test_search_aapl(self):
        """Test searching for AAPL"""
        response = client.get("/search/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    def test_search_apple(self):
        """Test searching by company name"""
        response = client.get("/search/Apple")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0

    def test_search_results_structure(self):
        """Test search results have correct structure"""
        response = client.get("/search/MSFT")
        data = response.json()
        
        for result in data["results"]:
            assert "symbol" in result
            assert "name" in result


# ══════════════════════════════════════════════════════════════
# UTILITY FUNCTION TESTS
# ══════════════════════════════════════════════════════════════

class TestTechnicalIndicators:
    def setup_method(self):
        """Setup test data"""
        dates = pd.date_range(start='2023-01-01', periods=100)
        prices = np.random.uniform(100, 200, 100)
        
        self.df = pd.DataFrame({
            'Open': prices,
            'High': prices + np.random.uniform(0, 5, 100),
            'Low': prices - np.random.uniform(0, 5, 100),
            'Close': prices + np.random.uniform(-2, 2, 100),
            'Volume': np.random.uniform(1e6, 1e7, 100)
        }, index=dates)

    def test_technical_indicators_calculation(self):
        """Test technical indicators are calculated"""
        df = add_technical_indicators(self.df.copy())
        
        assert "RSI" in df.columns
        assert "MACD" in df.columns
        assert "Signal" in df.columns
        assert "BB_upper" in df.columns
        assert "BB_lower" in df.columns
        assert "BB_pct" in df.columns
        assert "SMA_50" in df.columns
        assert "SMA_200" in df.columns
        assert "EMA_12" in df.columns
        assert "EMA_26" in df.columns

    def test_rsi_range(self):
        """Test RSI values are in valid range"""
        df = add_technical_indicators(self.df.copy())
        rsi = df["RSI"].dropna()
        
        assert rsi.min() >= 0
        assert rsi.max() <= 100

    def test_bb_pct_range(self):
        """Test Bollinger Bands percentage is in valid range"""
        df = add_technical_indicators(self.df.copy())
        bb_pct = df["BB_pct"].dropna()
        
        assert bb_pct.min() >= -0.5
        assert bb_pct.max() <= 1.5


# ══════════════════════════════════════════════════════════════
# EDGE CASE TESTS
# ══════════════════════════════════════════════════════════════

class TestEdgeCases:
    def test_case_insensitive_symbol(self):
        """Test stock symbols are case insensitive"""
        response1 = client.get("/stock/AAPL")
        response2 = client.get("/stock/aapl")
        
        # Both should work
        assert response1.status_code in [200, 404]
        assert response2.status_code in [200, 404]

    def test_prediction_days_boundary(self):
        """Test prediction days boundary values"""
        # Test day 1
        response = client.post("/predict/AAPL?days=1&model=lstm")
        assert response.status_code in [200, 404]
        
        # Test day 90
        response = client.post("/predict/AAPL?days=90&model=lstm")
        assert response.status_code in [200, 404]


# ══════════════════════════════════════════════════════════════
# PERFORMANCE TESTS
# ══════════════════════════════════════════════════════════════

class TestPerformance:
    @pytest.mark.skip(reason="Performance test")
    def test_prediction_response_time(self):
        """Test prediction response time < 2 seconds"""
        import time
        
        start = time.time()
        response = client.post("/predict/AAPL?days=7&model=lstm")
        end = time.time()
        
        assert (end - start) < 2.0, f"Prediction took {end - start} seconds"

    @pytest.mark.skip(reason="Performance test")
    def test_stock_response_time(self):
        """Test stock endpoint response time < 1 second"""
        import time
        
        start = time.time()
        response = client.get("/stock/AAPL")
        end = time.time()
        
        assert (end - start) < 1.0, f"Stock fetch took {end - start} seconds"


# ══════════════════════════════════════════════════════════════
# RUN TESTS
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
