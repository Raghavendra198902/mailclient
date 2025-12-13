# Backend Test Suite

This directory contains the test suite for the Gmail AI/ML Manager backend.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Pytest configuration and fixtures
├── test_auth.py             # Authentication endpoint tests
├── test_messages.py         # Message endpoint and model tests
├── test_ml_processor.py     # ML processing service tests
└── test_ai_endpoints.py     # AI/ML endpoint tests
```

## Running Tests

### Run all tests
```bash
cd backend
pytest
```

### Run specific test file
```bash
pytest tests/test_ml_processor.py
```

### Run with coverage
```bash
pytest --cov=app --cov-report=html
```

### Run with verbose output
```bash
pytest -v
```

### Run specific test class or function
```bash
pytest tests/test_ml_processor.py::TestEmailMLProcessor::test_generate_summary_without_openai
```

## Test Coverage

Current test coverage includes:
- ✅ Authentication endpoints (health, OAuth, logout)
- ✅ Message endpoints (unauthorized access tests)
- ✅ ML processor service (all major functions)
- ✅ AI/ML endpoints (unauthorized access tests)
- ✅ Database models (Account, Message creation and relationships)

## Fixtures

### Database Fixtures
- `test_db`: Provides an in-memory SQLite database session
- `test_account`: Creates a test account
- `test_message`: Creates a test message

### Data Fixtures
- `sample_email_data`: Sample email data for testing
- `sample_account_data`: Sample account data for testing
- `mock_openai_response`: Mock OpenAI API response

### Client Fixtures
- `client`: AsyncClient with database override for testing endpoints

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Import necessary fixtures from `conftest.py`
3. Create test classes and methods following the pattern:
   ```python
   class TestFeatureName:
       @pytest.mark.asyncio
       async def test_specific_behavior(self, client: AsyncClient):
           # Test implementation
           pass
   ```

## CI/CD Integration

These tests are designed to be run in CI/CD pipelines. Add to your workflow:

```yaml
- name: Run tests
  run: |
    cd backend
    pytest --cov=app --cov-report=xml
```

## Notes

- All async tests must use `@pytest.mark.asyncio` decorator
- Database tests use in-memory SQLite for speed and isolation
- Protected endpoints are tested for unauthorized access
- ML processor tests work without OpenAI API key (use fallbacks)
