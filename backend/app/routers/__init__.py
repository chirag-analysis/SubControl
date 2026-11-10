from .subscriptions import router as subscriptions_router
from .categories import router as categories_router
from .analytics import router as analytics_router
from .reviews import router as reviews_router
from .savings import router as savings_router
from .payments import router as payments_router
from .activity import router as activity_router

__all__ = [
    "subscriptions_router",
    "categories_router",
    "analytics_router",
    "reviews_router",
    "savings_router",
    "payments_router",
    "activity_router",
]
