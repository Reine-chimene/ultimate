#!/usr/bin/env python3
"""P1-A.3 notifications audit."""
from __future__ import annotations

import asyncio
import json
import sys
import uuid
from datetime import date, timedelta
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8100"
API = f"{BASE}/api/v1"

results: list[tuple[str, bool, str]] = []
_event_loop = asyncio.new_event_loop()
asyncio.set_event_loop(_event_loop)


def run_async(coro):
    return _event_loop.run_until_complete(coro)


def req(method: str, path: str, token: str | None = None, body: dict | None = None) -> tuple[int, dict | list]:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(f"{API}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"detail": raw}
        return e.code, payload


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


def register_user(suffix: str, gender: str = "male") -> tuple[str, dict, str]:
    email = f"notif_{suffix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "NotifTest123!"
    dob = (date.today() - timedelta(days=365 * 25)).isoformat()
    status, data = req("POST", "/auth/register", body={
        "first_name": f"N{suffix}",
        "email": email,
        "password": password,
        "date_of_birth": dob,
        "gender": gender,
        "city": "Montréal",
        "country": "CA",
        "terms_accepted": True,
        "is_adult": True,
    })
    assert status == 201, data
    token = data["tokens"]["access_token"]
    user = data["user"]
    req("PATCH", "/profiles/me", token, {"bio": "A" * 80, "relationship_intention": "relationship"})
    req("PATCH", "/profiles/me/preferences", token, {
        "looking_for_genders": ["female"] if gender == "male" else ["male"],
        "preferred_intentions": ["relationship"],
        "min_age": 18,
        "max_age": 45,
    })
    for interest in ("Voyage", "Musique", "Cuisine"):
        req("POST", "/profiles/me/interests", token, {"name": interest})
    req("POST", "/profiles/me/photos", token, {
        "url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        "is_primary": True,
    })
    req("POST", "/auth/onboarding/complete", token)
    _, profile = req("GET", "/profiles/me", token)
    return token, user, profile["id"]


def subscribe_premium(token: str) -> None:
    status, data = req("POST", "/subscriptions", token, {"plan": "premium", "duration_months": 1})
    assert status == 201, data


def find_notification(token: str, ntype: str) -> dict | None:
    status, data = req("GET", "/notifications?page=1&limit=50", token)
    if status != 200:
        return None
    items = data.get("items", [])
    for item in items:
        if item.get("type") == ntype:
            return item
    return None


async def count_notifications(user_id: str, ntype: str) -> int:
    from sqlalchemy import func, select

    from app.database import async_session_factory
    from app.models.subscription import Notification

    async with async_session_factory() as db:
        result = await db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == uuid.UUID(user_id),
                Notification.type == ntype,
            )
        )
        return int(result.scalar_one() or 0)


def main() -> int:
    print(f"P1-A.3 audit — {API}\n")

    token_a, user_a, profile_a_id = register_user("A", "male")
    token_b, user_b, profile_b_id = register_user("B", "female")
    token_c, user_c, profile_c_id = register_user("C", "male")

    # 1 — like notification
    req("POST", f"/profiles/me/like/{user_b['id']}", token_a)
    like_notif = find_notification(token_b, "like_received")
    record("1 — like notification", like_notif is not None, str(like_notif.get("type") if like_notif else ""))

    # 2 — match notification (reciprocal like)
    req("POST", f"/profiles/me/like/{user_a['id']}", token_b)
    match_a = find_notification(token_a, "match_created")
    match_b = find_notification(token_b, "match_created")
    record(
        "2 — match notification",
        match_a is not None and match_b is not None,
        f"a={bool(match_a)} b={bool(match_b)}",
    )

    # 15 — no duplicate match per user
    match_count_a = run_async(count_notifications(user_a["id"], "match_created"))
    record("15 — no duplicate match", match_count_a == 1, f"count={match_count_a}")

    # 4 — profile view notification
    req("GET", f"/profiles/{profile_b_id}", token_a)
    view_notif = find_notification(token_b, "profile_view")
    record("4 — profile view notification", view_notif is not None)

    # 6 — deduplicated view no extra notification
    before = run_async(count_notifications(user_b["id"], "profile_view"))
    req("GET", f"/profiles/{profile_b_id}", token_a)
    req("GET", f"/profiles/{profile_b_id}", token_a)
    after = run_async(count_notifications(user_b["id"], "profile_view"))
    record("6 — deduplicated view", after == before == 1, f"before={before} after={after}")

    # 5 — incognito no profile view notification
    subscribe_premium(token_c)
    req("PATCH", "/profiles/me/privacy", token_c, {"incognito_enabled": True})
    before_inc = run_async(count_notifications(user_b["id"], "profile_view"))
    req("GET", f"/profiles/{profile_b_id}", token_c)
    after_inc = run_async(count_notifications(user_b["id"], "profile_view"))
    record("5 — incognito no notification", after_inc == before_inc, f"count={after_inc}")

    # 7 — blocked no notification
    req("POST", "/reports/block", token_b, {"blocked_id": user_c["id"]})
    before_block = run_async(count_notifications(user_b["id"], "profile_view"))
    req("GET", f"/profiles/{profile_b_id}", token_c)
    after_block = run_async(count_notifications(user_b["id"], "profile_view"))
    record("7 — blocked no notification", after_block == before_block)

    # 3 — message notification
    status_matches, matches = req("GET", "/matches", token_a)
    match_id = matches[0]["id"] if status_matches == 200 and matches else None
    if match_id:
        req("POST", f"/messages/{match_id}", token_a, {"content": "Bonjour!"})
        msg_notif = find_notification(token_b, "message_received")
        record("3 — message notification", msg_notif is not None)
        record(
            "13 — actor/reference linked",
            msg_notif is not None
            and msg_notif.get("actor_user_id") == user_a["id"]
            and msg_notif.get("reference_type") == "match",
        )
        # 14 — sender not notified
        sender_msg = find_notification(token_a, "message_received")
        record("14 — sender not notified", sender_msg is None)
    else:
        record("3 — message notification", False, "no match")
        record("13 — actor/reference linked", False, "no match")
        record("14 — sender not notified", False, "no match")

    # 8 — IDOR
    if like_notif:
        status_idor, _ = req("PATCH", f"/notifications/{like_notif['id']}/read", token_a)
        record("8 — notification ownership", status_idor == 404, f"status={status_idor}")
    else:
        record("8 — notification ownership", False, "no notification")

    # 9 — unread count
    status_uc, uc = req("GET", "/notifications/unread-count", token_b)
    record("9 — unread count", status_uc == 200 and uc.get("count", 0) >= 1, str(uc))

    # 10 — mark read
    if like_notif:
        nid = like_notif["id"]
        status_read, read_res = req("PATCH", f"/notifications/{nid}/read", token_b)
        record(
            "10 — mark read",
            status_read == 200 and read_res.get("read_at") is not None,
        )
    else:
        record("10 — mark read", False)

    # 11 — mark all read
    status_all, all_res = req("PATCH", "/notifications/read-all", token_b)
    status_uc2, uc2 = req("GET", "/notifications/unread-count", token_b)
    record(
        "11 — mark all read",
        status_all == 200 and uc2.get("count") == 0,
        str(all_res),
    )

    # 12 — pagination
    status_page, page1 = req("GET", "/notifications?page=1&limit=1", token_b)
    status_page2, page2 = req("GET", "/notifications?page=2&limit=1", token_b)
    record(
        "12 — pagination",
        status_page == 200
        and page1.get("page") == 1
        and page2.get("page") == 2
        and "items" in page1,
    )

    # 16/17 — clic-match + messages still work
    token_d, user_d, _ = register_user("D", "female")
    status_like, like_res = req("POST", f"/profiles/me/like/{user_d['id']}", token_a)
    record("16 — clic-match regression", status_like in (200, 201), str(like_res)[:40])
    if match_id:
        status_msg, _ = req("POST", f"/messages/{match_id}", token_a, {"content": "test2"})
        record("17 — messages regression", status_msg == 201)
    else:
        record("17 — messages regression", False, "no match")

    print("\n=== SUMMARY ===")
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"Passed: {passed}/{len(results)}")
    failed = [(n, d) for n, ok, d in results if not ok]
    if failed:
        print("Failures:")
        for n, d in failed:
            print(f"  - {n}: {d}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
