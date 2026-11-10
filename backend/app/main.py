"""FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from mcp.server.sse import TransportSecuritySettings
import sys
# Ensure backend directory is in sys.path
backend_root = str(Path(__file__).resolve().parent.parent)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
from mcp_server import server as mcp_server

from .config import settings
from .database import Base, engine
from .routers import (
    activity_router,
    analytics_router,
    categories_router,
    payments_router,
    reviews_router,
    savings_router,
    subscriptions_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SubControl API",
    description="SaaS Subscription Management & Recurring Spend Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local development with Vite/React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(subscriptions_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(savings_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(activity_router, prefix="/api")

# Mount MCP SSE application at /mcp
# Provides live URL: /mcp/sse for remote Claude connection
mcp_sse_subapp = mcp_server.sse_app(
    transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False)
)
app.mount("/mcp", mcp_sse_subapp)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "SubControl Backend"}


# Mount static production build of React frontend if present
_dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if _dist_path.exists():
    app.mount("/", StaticFiles(directory=str(_dist_path), html=True), name="frontend")
