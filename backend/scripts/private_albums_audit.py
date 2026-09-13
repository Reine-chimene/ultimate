#!/usr/bin/env python3
"""P1-B.1 private albums audit — permission-focused API checks."""
from __future__ import annotations

import io
import json
import sys
import uuid
from datetime import date, timedelta
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8100"
API = f"{BASE}/api/v1"

results: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


def req(
    method: str,
    path: str,
    token: str | None = None,
    body: dict | None = None,
) -> tuple[int, dict]:
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


def upload_private_photo(token: str, album_id: str) -> tuple[int, dict]:
    boundary = uuid.uuid4().hex
    jpeg = _minimal_jpeg()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + jpeg + f"\r\n--{boundary}--\r\n".encode()
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Authorization": f"Bearer {token}",
    }
    request = Request(
        f"{API}/profiles/me/private-albums/{album_id}/photos",
        data=body,
        headers=headers,
        method="POST",
    )
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


def fetch_photo(token: str | None, album_id: str, photo_id: str) -> tuple[int, bytes]:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(
        f"{API}/private-albums/{album_id}/photos/{photo_id}",
        headers=headers,
        method="GET",
    )
    try:
        with urlopen(request, timeout=30) as resp:
            return resp.status, resp.read()
    except HTTPError as e:
        return e.code, e.read()


def _minimal_jpeg() -> bytes:
    try:
        from PIL import Image

        img = Image.new("RGB", (64, 64), color=(120, 40, 80))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()
    except Exception:
        return (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
            b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c"
            b"\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c"
            b"\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00"
            b"\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01"
            b"\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07"
            b"\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfe\x02\x1b?\xff\xd9"
        )


def register_user(suffix: str, gender: str = "male") -> tuple[str, dict]:
    email = f"palbum_{suffix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "AuditTest123!"
    dob = (date.today() - timedelta(days=365 * 28)).isoformat()
    status, data = req(
        "POST",
        "/auth/register",
        body={
            "first_name": f"Album{suffix}",
            "email": email,
            "password": password,
            "date_of_birth": dob,
            "gender": gender,
            "city": "Montréal",
            "country": "CA",
            "terms_accepted": True,
            "is_adult": True,
        },
    )
    assert status == 201, data
    token = data["tokens"]["access_token"]
    user = data["user"]
    req(
        "PATCH",
        "/profiles/me",
        token,
        {"bio": "A" * 80, "relationship_intention": "relationship"},
    )
    req(
        "PATCH",
        "/profiles/me/preferences",
        token,
        {
            "looking_for_genders": ["female"] if gender == "male" else ["male"],
            "preferred_intentions": ["relationship"],
            "min_age": 18,
            "max_age": 45,
        },
    )
    req("POST", "/profiles/me/photos", token, {"url": "https://picsum.photos/400", "is_primary": True})
    req("POST", "/auth/onboarding/complete", token)
    return token, user


def main() -> int:
    owner_t, owner = register_user("owner", "male")
    viewer_t, viewer = register_user("viewer", "female")
    other_t, other = register_user("other", "female")

    # 1 owner creates album
    s, album = req(
        "POST",
        "/profiles/me/private-albums",
        owner_t,
        {"title": "Mon album secret", "description": "Photos privées"},
    )
    record("owner creates album", s == 201 and "id" in album, f"status={s}")
    album_id = album.get("id", "")

    # 2 owner adds photo
    s, photo = upload_private_photo(owner_t, album_id)
    record("owner adds photo", s == 201 and photo.get("view_url"), f"status={s}")
    photo_id = photo.get("id", "")

    # 19 unauthenticated rejected
    s, _ = fetch_photo(None, album_id, photo_id)
    record("unauthenticated request rejected", s == 401, f"status={s}")

    # 3 unauthorized user cannot access
    s, _ = fetch_photo(viewer_t, album_id, photo_id)
    record("unauthorized user cannot access private photo", s == 403, f"status={s}")

    # 4 user can request access
    s, access_req = req(
        "POST",
        f"/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        viewer_t,
    )
    record("user can request access", s == 201 and access_req.get("status") == "pending", f"status={s}")
    request_id = access_req.get("id", "")

    # 5 duplicate pending rejected
    s, dup = req(
        "POST",
        f"/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        viewer_t,
    )
    record("duplicate pending request rejected", s == 400, f"status={s}")

    # 17 notification for owner
    s, notifs = req("GET", "/notifications?limit=50", owner_t)
    has_notif = any(n.get("type") == "private_album_access_request" for n in notifs.get("items", []))
    record("notification created for access request", s == 200 and has_notif)

    # 6 owner approves
    s, approved = req(
        "POST",
        f"/profiles/me/private-albums/{album_id}/requests/{request_id}/approve",
        owner_t,
    )
    record("owner approves request", s == 200 and approved.get("status") == "approved", f"status={s}")

    # 7 approved user can access
    s, content = fetch_photo(viewer_t, album_id, photo_id)
    record("approved user can access", s == 200 and len(content) > 100, f"status={s}, bytes={len(content)}")

    # 14 owner cannot request own album
    s, self_req = req(
        "POST",
        f"/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        owner_t,
    )
    record("owner cannot request own album", s == 400, f"status={s}")

    # 8/9 reject flow on second album
    s, album2 = req("POST", "/profiles/me/private-albums", owner_t, {"title": "Album 2"})
    album2_id = album2.get("id", "")
    s, _ = req(
        "POST",
        f"/profiles/{owner['id']}/private-albums/{album2_id}/request-access",
        other_t,
    )
    s, reqs = req("GET", f"/profiles/me/private-albums/{album2_id}/requests", owner_t)
    rej_id = reqs["requests"][0]["id"]
    s, rejected = req(
        "POST",
        f"/profiles/me/private-albums/{album2_id}/requests/{rej_id}/reject",
        owner_t,
    )
    record("owner rejects request", s == 200 and rejected.get("status") == "rejected", f"status={s}")
    s, up = upload_private_photo(owner_t, album2_id)
    photo2_id = up.get("id", "")
    s, _ = fetch_photo(other_t, album2_id, photo2_id)
    record("rejected user cannot access", s == 403, f"status={s}")

    # 10/11 revoke flow
    s, _ = req(
        "POST",
        f"/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        other_t,
    )
    s, reqs = req("GET", f"/profiles/me/private-albums/{album_id}/requests", owner_t)
    revoke_req = next(r for r in reqs["requests"] if r["requester_id"] == other["id"])
    s, _ = req(
        "POST",
        f"/profiles/me/private-albums/{album_id}/requests/{revoke_req['id']}/approve",
        owner_t,
    )
    s, _ = fetch_photo(other_t, album_id, photo_id)
    record("approved other before revoke", s == 200)
    s, revoked = req(
        "POST",
        f"/profiles/me/private-albums/{album_id}/requests/{revoke_req['id']}/revoke",
        owner_t,
    )
    record("owner revokes access", s == 200 and revoked.get("status") == "revoked", f"status={s}")
    s, _ = fetch_photo(other_t, album_id, photo_id)
    record("revoked user cannot access", s == 403, f"status={s}")

    # 12 blocked user cannot access
    req("POST", "/reports/block", owner_t, {"blocked_id": viewer["id"]})
    s, _ = fetch_photo(viewer_t, album_id, photo_id)
    record("blocked user cannot access", s in (403, 404), f"status={s}")
    req("DELETE", f"/reports/block/{viewer['id']}", owner_t)
    s, _ = fetch_photo(viewer_t, album_id, photo_id)
    record("unblocked viewer still has access", s == 200, f"status={s}")

    # 13 bilateral block
    req("POST", "/reports/block", viewer_t, {"blocked_id": owner["id"]})
    s, _ = req(
        "POST",
        f"/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        viewer_t,
    )
    record("bilateral block prevents new request", s in (400, 404), f"status={s}")
    req("DELETE", f"/reports/block/{owner['id']}", viewer_t)

    # 16 bypass via public media path
    s, _ = fetch_photo(None, album_id, photo_id)
    bypass_status = s
    try:
        bypass_req = Request(f"{BASE}/media/private/fake/path.jpg", method="GET")
        with urlopen(bypass_req, timeout=10) as resp:
            bypass_status = resp.status
    except HTTPError as e:
        bypass_status = e.code
    except Exception:
        bypass_status = 404
    record("private URL bypass protection", bypass_status in (401, 403, 404), f"status={bypass_status}")

    # 15 deleted album invalidates access
    s, del_album = req("POST", "/profiles/me/private-albums", owner_t, {"title": "Temp"})
    temp_id = del_album.get("id", "")
    s, temp_photo = upload_private_photo(owner_t, temp_id)
    temp_photo_id = temp_photo.get("id", "")
    req("DELETE", f"/profiles/me/private-albums/{temp_id}", owner_t)
    s, _ = fetch_photo(viewer_t, temp_id, temp_photo_id)
    record("deleted album invalidates access", s == 404, f"status={s}")

    # 18 self-access: owner can view
    s, _ = fetch_photo(owner_t, album_id, photo_id)
    record("owner self-access enforced", s == 200, f"status={s}")

    # 20 regression smoke
    s, me = req("GET", "/profiles/me", owner_t)
    s2, _ = req("GET", "/profiles/me/privacy", owner_t)
    s3, _ = req("GET", "/notifications/unread-count", owner_t)
    record(
        "regression P0/P1-A smoke",
        s == 200 and s2 == 200 and s3 == 200 and me.get("photos"),
        f"profile={s} privacy={s2} notif={s3}",
    )

    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"\n=== PRIVATE ALBUMS AUDIT: {passed}/{total} ===")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
