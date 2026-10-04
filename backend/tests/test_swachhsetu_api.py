"""SwachhSetu 2.0 API tests — exercises all /api/* endpoints via the public URL."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://swachhsetu-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_PAYLOAD = {
    "description": "Garbage has been overflowing for three days near the community park.",
    "ward": 17,
    "location": "Shivaji Nagar Community Park",
    "latitude": 22.7196,
    "longitude": 75.8577,
    "hasVoice": False,
}


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session", autouse=True)
def reset_at_end(client):
    yield
    try:
        client.post(f"{API}/demo/reset", timeout=15)
    except Exception:
        pass


@pytest.fixture(scope="module")
def demo_ticket(client):
    r = client.post(f"{API}/complaints", json=DEMO_PAYLOAD, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["ticketId"]


# ---------- Meta / root ----------
def test_root(client):
    r = client.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert "SwachhSetu" in r.json()["name"]


def test_meta(client):
    r = client.get(f"{API}/meta", timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["wards", "categories", "departments", "teams", "statuses"]:
        assert k in d and len(d[k]) > 0
    assert "SUBMITTED" in d["statuses"]


# ---------- Create / List / Get ----------
def test_create_demo_complaint(client):
    r = client.post(f"{API}/complaints", json=DEMO_PAYLOAD, timeout=20)
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["ticketId"].startswith("SWC-2026-")
    # Expected deterministic values per request
    assert c["priority"] == 94, f"priority={c['priority']}"
    assert c["severity"] == "high"
    assert c["priorityClass"] in ("P1", "P2", "P3", "P4")
    assert c["priorityClass"] == "P1"
    assert c["categoryLabel"] == "Garbage Overflow"
    assert c["department"] == "Solid Waste Management"
    assert c["ward"] == 17
    assert "Ward 17" in c["team"] and "Sanitation" in c["team"]
    dups = c.get("ai", {}).get("duplicates", {})
    assert dups.get("count", 0) >= 3
    assert dups.get("similarity", 0) >= 85
    # Verify persisted
    g = client.get(f"{API}/complaints/{c['ticketId']}", timeout=15)
    assert g.status_code == 200
    assert g.json()["ticketId"] == c["ticketId"]


def test_list_complaints(client):
    r = client.get(f"{API}/complaints", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 20


def test_list_filters(client):
    r = client.get(f"{API}/complaints?ward=17", timeout=15)
    assert r.status_code == 200
    assert all(c["ward"] == 17 for c in r.json())


def test_get_missing(client):
    r = client.get(f"{API}/complaints/SWC-2026-00000", timeout=15)
    assert r.status_code == 404


# ---------- Validation ----------
def test_create_short_description(client):
    r = client.post(f"{API}/complaints", json={**DEMO_PAYLOAD, "description": "short"}, timeout=15)
    assert r.status_code == 422


def test_create_bad_ward(client):
    r = client.post(f"{API}/complaints", json={**DEMO_PAYLOAD, "ward": 999}, timeout=15)
    assert r.status_code == 422


def test_status_bad(client, demo_ticket):
    tid = demo_ticket
    r = client.post(f"{API}/complaints/{tid}/status", json={"status": "NOT_A_STATUS"}, timeout=15)
    assert r.status_code == 400


# ---------- Triage / Route / Escalate ----------
def test_triage(client):
    r = client.post(f"{API}/triage", json={"description": DEMO_PAYLOAD["description"], "ward": 17,
                                            "latitude": 22.7196, "longitude": 75.8577}, timeout=15)
    assert r.status_code == 200
    assert "category" in r.json() and "priority" in r.json()


def test_route(client):
    r = client.post(f"{API}/route", json={"category": "garbage", "ward": 17, "priority": 94}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "department" in d and "team" in d and "escalationChain" in d


def test_route_bad_category(client):
    r = client.post(f"{API}/route", json={"category": "fake_cat", "ward": 17}, timeout=15)
    assert r.status_code == 400


def test_escalate(client, demo_ticket):
    tid = demo_ticket
    r = client.post(f"{API}/escalate", json={"ticketId": tid, "reason": "Testing"}, timeout=15)
    assert r.status_code == 200
    assert r.json()["escalated"] in (True, False)


# ---------- Status / Override / Feedback / Breach ----------
def test_status_update(client, demo_ticket):
    tid = demo_ticket
    r = client.post(f"{API}/complaints/{tid}/status", json={"status": "IN_PROGRESS", "note": "test"}, timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "IN_PROGRESS"


def test_override_custom(client, demo_ticket):
    tid = demo_ticket
    r = client.post(f"{API}/complaints/{tid}/override",
                    json={"accept": False, "priority": 80, "note": "manual priority"}, timeout=15)
    assert r.status_code == 200
    assert r.json()["priority"] == 80


def test_override_accept(client):
    # Create fresh ticket to accept AI
    cr = client.post(f"{API}/complaints", json=DEMO_PAYLOAD, timeout=15)
    tid = cr.json()["ticketId"]
    r = client.post(f"{API}/complaints/{tid}/override", json={"accept": True}, timeout=15)
    assert r.status_code == 200
    assert r.json()["officerDecision"]["accepted"] is True


def test_simulate_breach(client, demo_ticket):
    tid = demo_ticket
    r = client.post(f"{API}/complaints/{tid}/simulate-breach", timeout=15)
    assert r.status_code == 200


def test_feedback_no(client, demo_ticket):
    tid = demo_ticket
    r = client.post(f"{API}/complaints/{tid}/feedback", json={"resolved": False}, timeout=15)
    assert r.status_code == 200
    assert "action" in r.json()


def test_feedback_yes(client):
    cr = client.post(f"{API}/complaints", json=DEMO_PAYLOAD, timeout=15)
    tid = cr.json()["ticketId"]
    r = client.post(f"{API}/complaints/{tid}/feedback", json={"resolved": True}, timeout=15)
    assert r.status_code == 200
    assert r.json()["complaint"]["status"] == "RESOLVED"


# ---------- Dashboard / Hotspots / Duplicates ----------
def test_dashboard(client):
    r = client.get(f"{API}/dashboard", timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["total", "pending", "highPriority", "resolvedToday", "slaBreaches"]:
        assert k in d["kpis"]
    assert isinstance(d["queue"], list)


def test_hotspots(client):
    r = client.get(f"{API}/hotspots", timeout=15)
    assert r.status_code == 200


def test_duplicates_all(client):
    r = client.get(f"{API}/duplicates", timeout=15)
    assert r.status_code == 200
    assert "clusters" in r.json()


def test_duplicates_by_ticket(client, demo_ticket):
    r = client.get(f"{API}/duplicates", params={"ticketId": demo_ticket}, timeout=15)
    assert r.status_code == 200
    assert "count" in r.json()
