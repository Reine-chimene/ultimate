#!/usr/bin/env python3
"""P1-A.2 profile views + incognito audit."""
from __future__ import annotations

import asyncio
import json
import sys
import uuid
from datetime import UTC, date, datetime, timedelta
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8100"
API = f"{BASE}/api/v1"

results: list[tuple[str, bool, str]] = []
_event_loop = asyncio.new_event_loop()
asyncio.set_event_loop(_event_loop)


def run_async(coro):
    return _event_loop.run_until_complete(coro)


def req(method: str, path: str, token: str | None = None, body: dict | None = None) -> tuple[int, dict]:
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
    email = f"p12_{suffix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "P12Test123!"
    dob = (date.today() - timedelta(days=365 * 25)).isoformat()
    status, data = req("POST", "/auth/register", body={
        "first_name": f"P12{suffix}",
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
    req("PATCH", "/profiles/me", token, {
        "bio": "A" * 80,
        "relationship_intention": "relationship",
    })
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


def visitor_total(token: str) -> int:
    status, data = req("GET", "/profiles/me/visitors?page=1&limit=50", token)
    if status != 200:
        return -1
    return int(data.get("total_count") or 0)


def main() -> int:
    print(f"P1-A.2 audit — {API}\n")

    token_a, user_a, profile_a_id = register_user("A", "male")
    token_b, user_b, profile_b_id = register_user("B", "female")
    token_c, user_c, profile_c_id = register_user("C", "male")

    # 1 — visit created
    status, _ = req("GET", f"/profiles/{profile_a_id}", token_b)
    views = visitor_total(token_a)
    record("1 — profile visit created", status == 200 and views >= 1, f"total={views}")

    # 12 — deduplication (refresh / repeated view)
    req("GET", f"/profiles/{profile_a_id}", token_b)
    req("GET", f"/profiles/{profile_a_id}", token_b)
    views_dedup = visitor_total(token_a)
    record("12 — visit deduplication 24h", views_dedup == 1, f"total={views_dedup}")

    # 2 — self view
    before_self = visitor_total(token_a)
    status_self, _ = req("GET", f"/profiles/{profile_a_id}", token_a)
    after_self = visitor_total(token_a)
    record(
        "2 — self view no visit",
        status_self == 200 and after_self == before_self,
        f"before={before_self} after={after_self}",
    )

    # 3 — blocked user
    req("POST", "/reports/block", token_a, {"blocked_id": user_b["id"]})
    status_blocked, _ = req("GET", f"/profiles/{profile_a_id}", token_b)
    views_blocked = visitor_total(token_a)
    record(
        "3 — blocked no visit",
        status_blocked == 404 and views_blocked == 1,
        f"status={status_blocked} views={views_blocked}",
    )
    req("DELETE", f"/reports/block/{user_b['id']}", token_a)

    # 4 — normal visitor after unblock
    req("GET", f"/profiles/{profile_a_id}", token_b)
    record("4 — normal visitor recorded", visitor_total(token_a) >= 1)

    # 6 — free cannot enable incognito
    status_free, data_free = req("PATCH", "/profiles/me/privacy", token_b, {"incognito_enabled": True})
    record(
        "6 — free incognito rejected",
        status_free == 400 and "Premium" in str(data_free.get("detail", "")),
        str(data_free.get("detail", ""))[:60],
    )

    # 7/8 — premium incognito toggle
    subscribe_premium(token_c)
    status_on, priv_on = req("PATCH", "/profiles/me/privacy", token_c, {"incognito_enabled": True})
    status_off, priv_off = req("PATCH", "/profiles/me/privacy", token_c, {"incognito_enabled": False})
    record(
        "7 — premium enable incognito",
        status_on == 200 and priv_on.get("incognito_enabled") is True,
        str(priv_on),
    )
    record(
        "8 — premium disable incognito",
        status_off == 200 and priv_off.get("incognito_enabled") is False,
        str(priv_off),
    )

    # 5 — incognito premium no visit
    req("PATCH", "/profiles/me/privacy", token_c, {"incognito_enabled": True})
    before_inc = visitor_total(token_a)
    req("GET", f"/profiles/{profile_a_id}", token_c)
    after_inc = visitor_total(token_a)
    record(
        "5 — incognito premium no visit",
        after_inc == before_inc,
        f"before={before_inc} after={after_inc}",
    )
    req("PATCH", "/profiles/me/privacy", token_c, {"incognito_enabled": False})

    # 10 — free visitors teaser
    status_vis_free, vis_free = req("GET", "/profiles/me/visitors", token_a)
    record(
        "10 — free no full visitor list",
        status_vis_free == 200
        and vis_free.get("is_premium") is False
        and len(vis_free.get("visitors", [])) == 0
        and vis_free.get("total_count", 0) >= 1,
        f"count={vis_free.get('total_count')} teaser={bool(vis_free.get('teaser'))}",
    )

    # 9/11 — premium visitors list + pagination
    subscribe_premium(token_a)
    status_vis, vis = req("GET", "/profiles/me/visitors?page=1&limit=1", token_a)
    has_visitor = len(vis.get("visitors", [])) == 1
    record(
        "9 — premium visitors list",
        status_vis == 200 and vis.get("is_premium") is True and has_visitor,
        f"total={vis.get('total_count')}",
    )
    status_p2, vis_p2 = req("GET", "/profiles/me/visitors?page=2&limit=1", token_a)
    record(
        "11 — visitors pagination",
        status_p2 == 200 and vis_p2.get("page") == 2,
        f"page={vis_p2.get('page')}",
    )

    # 13 — privacy respected in visitor profiles
    req("PATCH", "/profiles/me/privacy", token_b, {"show_online": False})
    req("GET", "/profiles/me", token_b)
    status_vis_priv, vis_priv = req("GET", "/profiles/me/visitors?page=1&limit=10", token_a)
    offline_ok = all(
        v.get("profile", {}).get("online_status") == "offline"
        for v in vis_priv.get("visitors", [])
        if v.get("user_id") == user_b["id"]
    )
    record("13 — privacy P1-A.1 in visitors", status_vis_priv == 200 and offline_ok)

    # 14 — no private data in visitor profiles
    leaked = False
    for v in vis_priv.get("visitors", []):
        profile = v.get("profile", {})
        if profile.get("first_name") or "email" in profile or "password" in profile:
            leaked = True
    record("14 — no private data exposed", not leaked)

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
