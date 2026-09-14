from fastapi import APIRouter

from app.routers import (
    admin,
    auth,
    availability,
    connections,
    discovery,
    feed,
    likes,
    live,
    live_ws,
    matches,
    meetings,
    messages,
    messages_ws,
    notifications,
    private_albums,
    profiles,
    reports,
    search,
    subscriptions,
    travel,
    world,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(private_albums.router)
api_router.include_router(connections.router)
api_router.include_router(discovery.router)
api_router.include_router(search.router)
api_router.include_router(likes.router)
api_router.include_router(matches.router)
api_router.include_router(messages.router)
api_router.include_router(messages_ws.router)
api_router.include_router(availability.router)
api_router.include_router(meetings.router)
api_router.include_router(subscriptions.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
api_router.include_router(world.router)
api_router.include_router(travel.router)
api_router.include_router(feed.router)
api_router.include_router(live.router)
api_router.include_router(live_ws.router)
