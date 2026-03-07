"""
pytest configuration and shared fixtures
"""
import pytest
import os

# Ensure environment variable is set
@pytest.fixture(scope="session", autouse=True)
def setup_environment():
    """Setup environment variables for testing"""
    if not os.environ.get('REACT_APP_BACKEND_URL'):
        os.environ['REACT_APP_BACKEND_URL'] = 'https://extract-preview-13.preview.emergentagent.com'
    yield
