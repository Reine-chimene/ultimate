from fastapi import APIRouter

from app.routers import (
    admin,
    auth,
    availability,
    discovery,
    likes,
    matches,
    meetings,
    messages,
    notifications,
    profiles,
    reports,
    subscriptions,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(discovery.router)
api_router.include_router(likes.router)
api_router.include_router(matches.router)
api_router.include_router(messages.router)
api_router.include_router(availability.router)
api_router.include_router(meetings.router)
api_router.include_router(subscriptions.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
