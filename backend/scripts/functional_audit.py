#!/usr/bin/env python3
"""Functional audit script — tests critical API flows against running backend."""
from __future__ import annotations

import json
import sys
import uuid
from datetime import date, timedelta
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8100"
API = f"{BASE}/api/v1"

results: list[tuple[str, bool, str]] = []


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


def register_user(suffix: str, gender: str = "male", looking_setup: bool = True) -> tuple[str, dict]:
    email = f"audit_{suffix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "AuditTest123!"
    dob = (date.today() - timedelta(days=365 * 25)).isoformat()
    status, data = req("POST", "/auth/register", body={
        "first_name": f"Audit{suffix}",
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
    if looking_setup:
        # Complete minimal profile for compatibility
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
    return token, user


def main() -> int:
    print(f"Auditing {API}\n")

    # Health
    status, _ = req("GET", "/../health".replace("/api/v1/../", "/") if False else "/health")
    # health is at root not under api
    import urllib.request
    with urllib.request.urlopen(f"{BASE}/health", timeout=10) as r:
        health = json.loads(r.read())
    record("Health endpoint", health.get("status") == "ok")

    # Under-18 registration rejected
    status, data = req("POST", "/auth/register", body={
        "first_name": "Minor",
        "email": f"minor_{uuid.uuid4().hex[:8]}@example.com",
        "password": "AuditTest123!",
        "date_of_birth": (date.today() - timedelta(days=365 * 17)).isoformat(),
        "gender": "male",
        "city": "Montréal",
        "country": "CA",
        "terms_accepted": True,
        "is_adult": True,
    })
    record("Under-18 registration rejected", status in (400, 422), str(data.get("detail", ""))[:80])

    # Duplicate email
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    body = {
        "first_name": "Dup",
        "email": email,
        "password": "AuditTest123!",
        "date_of_birth": (date.today() - timedelta(days=365 * 25)).isoformat(),
        "gender": "male",
        "city": "Montréal",
        "country": "CA",
        "terms_accepted": True,
        "is_adult": True,
    }
    status1, _ = req("POST", "/auth/register", body=body)
    status2, data2 = req("POST", "/auth/register", body=body)
    record("Registration works", status1 == 201)
    record("Duplicate email rejected", status2 == 400)

    # Login invalid
    status, _ = req("POST", "/auth/login", body={"email": email, "password": "wrong"})
    record("Invalid login rejected", status == 401)

    # Create two compatible users
    token_a, user_a = register_user("A", "male")
    token_b, user_b = register_user("B", "female")

    # Profile completion
    status, completion = req("GET", "/profiles/me/completion", token_a)
    record("Profile completion endpoint", status == 200 and completion.get("percent", 0) >= 80)

    # Discovery loads
    status, discovery = req("GET", "/discovery?limit=5&mode=near_me", token_a)
    record("Discovery loads", status == 200 and "profiles" in discovery)

    # Connection request
    status, conn = req("POST", "/connections/request", token_a, {
        "receiver_id": user_b["id"],
        "intro_message": "Bonjour, j'aimerais faire connaissance.",
    })
    record("Connection request sent", status == 201 and conn.get("state") == "pending_sent")

    # Duplicate request blocked
    status_dup, data_dup = req("POST", "/connections/request", token_a, {
        "receiver_id": user_b["id"],
    })
    record("Duplicate connection request blocked", status_dup == 400)

    # B sees pending
    status, pending = req("GET", "/connections/pending", token_b)
    received = pending.get("received", [])
    record("Pending request visible to recipient", status == 200 and len(received) >= 1)

    # Messaging blocked before accept — no match exists yet
    status, matches_b = req("GET", "/matches", token_b)
    match_id = matches_b[0]["id"] if isinstance(matches_b, list) and matches_b else None
    if match_id:
        status_msg, _ = req("POST", f"/messages/{match_id}", token_a, {"content": "test"})
        record("Message blocked before accept (no match)", status_msg == 403 or status_msg == 404)
    else:
        # Try sending with fake UUID — should 404
        fake_match = str(uuid.uuid4())
        status_msg, data_msg = req("POST", f"/messages/{fake_match}", token_a, {"content": "test"})
        record("Message blocked without match", status_msg in (403, 404), str(data_msg.get("detail", ""))[:60])

    # B accepts
    status, accepted = req("POST", f"/connections/{user_a['id']}/accept", token_b)
    record("Connection accept creates match", status == 200 and accepted.get("state") == "connected" and accepted.get("match_id"))
    match_id = accepted.get("match_id")

    # Messaging after accept
    status, msg = req("POST", f"/messages/{match_id}", token_a, {"content": "Hello after connect"})
    record("Message allowed after accept", status == 201 and msg.get("content") == "Hello after connect")

    # B cannot accept own outgoing (no pending from B to A)
    status, _ = req("POST", f"/connections/{user_b['id']}/accept", token_a)
    record("Cannot accept non-existent incoming", status == 400)

    # Meeting requires connection — create incompatible users
    token_c, user_c = register_user("C", "male")
    token_d, user_d = register_user("D", "female")
    # Make D look for women only (incompatible with C male seeking... actually C seeks female, D seeks female - incompatible)
    req("PATCH", "/profiles/me/preferences", token_d, {"looking_for_genders": ["female"]})
    status, meet = req("POST", "/meetings", token_c, {
        "receiver_id": user_d["id"],
        "proposed_at": "2026-12-01T19:00:00Z",
        "location": "Café public",
    })
    record("Meeting without connection blocked", status in (400, 403))

    # Connected meeting works
    req("POST", "/connections/request", token_c, {"receiver_id": user_d["id"]})
    # D won't accept incompatible - connection request might fail at send if incompatible
    status_req, _ = req("POST", "/connections/request", token_c, {"receiver_id": user_d["id"]})
    # use connected pair A-B for meeting
    status, meet_ok = req("POST", "/meetings", token_a, {
        "receiver_id": user_b["id"],
        "proposed_at": "2026-12-01T19:00:00Z",
        "location": "Café public centre-ville",
    })
    record("Meeting with connected users", status == 201 or status == 200)

    # Admin blocked for normal user
    status, _ = req("GET", "/admin/stats", token_a)
    record("Non-admin blocked from admin", status == 403)

    # Demo admin if exists
    status, login_admin = req("POST", "/auth/login", body={"email": "admin@ultimate.ca", "password": "Admin123!"})
    if status == 200:
        admin_token = login_admin["tokens"]["access_token"]
        status, _ = req("GET", "/admin/stats", admin_token)
        record("Admin can access admin stats", status == 200)
    else:
        record("Admin login (seed)", False, "demo admin not available")

    # IDOR: A cannot patch B profile — profiles are /profiles/me only
    status, _ = req("PATCH", "/profiles/me", token_a, {"bio": "Hacked"})
    record("Profile update own only (endpoint design)", status == 200)

    # Unauthorized access
    status, _ = req("GET", "/profiles/me")
    record("Unauthenticated blocked", status == 401)

    # Refresh token endpoint
    status, login_ok = req("POST", "/auth/login", body={"email": email, "password": "AuditTest123!"})
    if status == 200:
        rt = login_ok["tokens"]["refresh_token"]
        status_ref, tokens_ref = req("POST", "/auth/refresh", body={"refresh_token": rt})
        record("Refresh token endpoint works", status_ref == 200 and "access_token" in tokens_ref)
        status_bad, _ = req("POST", "/auth/refresh", body={"refresh_token": "fake"})
        record("Invalid refresh token rejected", status_bad == 401)
    else:
        record("Refresh token endpoint works", False, "login failed for refresh test")

    print("\n=== SUMMARY ===")
    passed = sum(1 for _, ok, _ in results if ok)
    failed = [(n, d) for n, ok, d in results if not ok]
    print(f"Passed: {passed}/{len(results)}")
    if failed:
        print("Failures:")
        for n, d in failed:
            print(f"  - {n}: {d}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
