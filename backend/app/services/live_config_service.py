from app.config import get_settings

settings = get_settings()

DEFAULT_STUN = [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun.relay.metered.ca:80",
]

# Relais TURN public Metered (fallback si aucun TURN custom configuré)
OPENRELAY_TURN = {
    "urls": [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turns:openrelay.metered.ca:443",
    ],
    "username": "openrelayproject",
    "credential": "openrelayproject",
}


def build_ice_servers() -> list[dict]:
    servers: list[dict] = [{"urls": url} for url in DEFAULT_STUN]

    custom_urls = [u.strip() for u in settings.turn_urls.split(",") if u.strip()]
    if custom_urls:
        turn: dict = {"urls": custom_urls}
        if settings.turn_username:
            turn["username"] = settings.turn_username
        if settings.turn_credential:
            turn["credential"] = settings.turn_credential
        servers.append(turn)
    else:
        servers.append(OPENRELAY_TURN)

    return servers
