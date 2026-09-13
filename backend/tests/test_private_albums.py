"""P1-B.1 private albums permission tests."""
from __future__ import annotations

import io
import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient


def _minimal_jpeg() -> bytes:
    from PIL import Image

    img = Image.new("RGB", (64, 64), color=(90, 30, 70))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


async def register(client: AsyncClient, api_prefix: str, suffix: str, gender: str = "male") -> tuple[str, dict]:
    email = f"pytest_palbum_{suffix}_{uuid.uuid4().hex[:8]}@example.com"
    dob = (date.today() - timedelta(days=365 * 27)).isoformat()
    resp = await client.post(
        f"{api_prefix}/auth/register",
        json={
            "first_name": f"Py{suffix}",
            "email": email,
            "password": "TestPass123!",
            "date_of_birth": dob,
            "gender": gender,
            "city": "Montréal",
            "country": "CA",
            "terms_accepted": True,
            "is_adult": True,
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    token = data["tokens"]["access_token"]
    user = data["user"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.patch(
        f"{api_prefix}/profiles/me",
        headers=headers,
        json={"bio": "X" * 80, "relationship_intention": "relationship"},
    )
    await client.patch(
        f"{api_prefix}/profiles/me/preferences",
        headers=headers,
        json={
            "looking_for_genders": ["female"] if gender == "male" else ["male"],
            "preferred_intentions": ["relationship"],
            "min_age": 18,
            "max_age": 45,
        },
    )
    await client.post(
        f"{api_prefix}/profiles/me/photos",
        headers=headers,
        json={"url": "https://picsum.photos/400", "is_primary": True},
    )
    await client.post(f"{api_prefix}/auth/onboarding/complete", headers=headers)
    return token, user


@pytest.mark.asyncio
async def test_private_album_permissions(client: AsyncClient, api_prefix: str):
    owner_t, owner = await register(client, api_prefix, "own", "male")
    viewer_t, viewer = await register(client, api_prefix, "view", "female")
    owner_h = {"Authorization": f"Bearer {owner_t}"}
    viewer_h = {"Authorization": f"Bearer {viewer_t}"}

    # 1 owner creates album
    r = await client.post(
        f"{api_prefix}/profiles/me/private-albums",
        headers=owner_h,
        json={"title": "Secret", "description": "Privé"},
    )
    assert r.status_code == 201
    album_id = r.json()["id"]

    # 2 owner adds photo
    files = {"file": ("test.jpg", _minimal_jpeg(), "image/jpeg")}
    r = await client.post(
        f"{api_prefix}/profiles/me/private-albums/{album_id}/photos",
        headers=owner_h,
        files=files,
    )
    assert r.status_code == 201
    photo_id = r.json()["id"]

    # 19 unauthenticated
    r = await client.get(f"{api_prefix}/private-albums/{album_id}/photos/{photo_id}")
    assert r.status_code == 401

    # 3 unauthorized
    r = await client.get(
        f"{api_prefix}/private-albums/{album_id}/photos/{photo_id}",
        headers=viewer_h,
    )
    assert r.status_code == 403

    # 4 request access
    r = await client.post(
        f"{api_prefix}/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        headers=viewer_h,
    )
    assert r.status_code == 201
    request_id = r.json()["id"]

    # 5 duplicate pending
    r = await client.post(
        f"{api_prefix}/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        headers=viewer_h,
    )
    assert r.status_code == 400

    # 17 notification
    r = await client.get(f"{api_prefix}/notifications?limit=50", headers=owner_h)
    types = [n["type"] for n in r.json()["items"]]
    assert "private_album_access_request" in types

    # 6 approve
    r = await client.post(
        f"{api_prefix}/profiles/me/private-albums/{album_id}/requests/{request_id}/approve",
        headers=owner_h,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "approved"

    # 7 approved access
    r = await client.get(
        f"{api_prefix}/private-albums/{album_id}/photos/{photo_id}",
        headers=viewer_h,
    )
    assert r.status_code == 200
    assert len(r.content) > 50

    # 14 self request
    r = await client.post(
        f"{api_prefix}/profiles/{owner['id']}/private-albums/{album_id}/request-access",
        headers=owner_h,
    )
    assert r.status_code == 400

    # 10 revoke
    r = await client.post(
        f"{api_prefix}/profiles/me/private-albums/{album_id}/requests/{request_id}/revoke",
        headers=owner_h,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "revoked"

    # 11 revoked no access
    r = await client.get(
        f"{api_prefix}/private-albums/{album_id}/photos/{photo_id}",
        headers=viewer_h,
    )
    assert r.status_code == 403

    # 18 owner access
    r = await client.get(
        f"{api_prefix}/private-albums/{album_id}/photos/{photo_id}",
        headers=owner_h,
    )
    assert r.status_code == 200

    # 12 block
    await client.post(
        f"{api_prefix}/reports/block",
        headers=owner_h,
        json={"blocked_id": viewer["id"]},
    )
    r = await client.get(
        f"{api_prefix}/private-albums/{album_id}/photos/{photo_id}",
        headers=viewer_h,
    )
    assert r.status_code in (403, 404)

    # 15 delete album
    r = await client.post(
        f"{api_prefix}/profiles/me/private-albums",
        headers=owner_h,
        json={"title": "Temp"},
    )
    temp_id = r.json()["id"]
    files = {"file": ("t.jpg", _minimal_jpeg(), "image/jpeg")}
    r = await client.post(
        f"{api_prefix}/profiles/me/private-albums/{temp_id}/photos",
        headers=owner_h,
        files=files,
    )
    temp_photo = r.json()["id"]
    await client.delete(f"{api_prefix}/profiles/me/private-albums/{temp_id}", headers=owner_h)
    r = await client.get(
        f"{api_prefix}/private-albums/{temp_id}/photos/{temp_photo}",
        headers=owner_h,
    )
    assert r.status_code == 404

    # 20 regression
    assert (await client.get(f"{api_prefix}/profiles/me", headers=owner_h)).status_code == 200
    assert (await client.get(f"{api_prefix}/profiles/me/privacy", headers=owner_h)).status_code == 200
