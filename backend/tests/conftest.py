"""Pytest fixtures for ULTIMATE backend integration tests."""
from __future__ import annotations

import os

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.fixture
def api_prefix() -> str:
    return "/api/v1"
