"""SwachhSetu 2.0 API — prototype / mock municipal system. In-memory store seeded from data/complaints.json."""
import copy
import json
import logging
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.cors import CORSMiddleware

from agents import (triage_agent, routing_agent, action_agent, insight_agent, detect_duplicates,
                    CATEGORY_LABELS, DEPARTMENTS, WARD_NAMES, team_for, escalation_chain, priority_class)
from pipeline import build_complaint, with_action, audit_entry

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
from auth import auth_router, get_current_user, optional_user, require_admin, init_auth  # noqa: E402
SEED_FILE = ROOT_DIR / "data" / "complaints.json"
TIME_KEYS = {"createdAt", "slaDueAt", "resolvedAt", "timestamp", "time"}
STATUSES = ["SUBMITTED", "ASSIGNED", "INSPECTION_SCHEDULED", "IN_PROGRESS", "RESOLVED"]
DEMO_KPIS = {"total": 128, "pending": 37, "highPriority": 12, "resolvedToday": 79, "slaBreaches": 6}

app = FastAPI(title="SwachhSetu 2.0 API (Prototype)")
api = APIRouter(prefix="/api")
STORE = {"complaints": {}, "counter": 10482, "seedIds": set(), "seedBreaches": 0}


def now_utc():
    return datetime.now(timezone.utc)


def shift_times(obj, delta):
    if isinstance(obj, dict):
        return {k: (datetime.fromisoformat(v) + delta).isoformat() if k in TIME_KEYS and isinstance(v, str)
                else shift_times(v, delta) for k, v in obj.items()}
    if isinstance(obj, list):
        return [shift_times(v, delta) for v in obj]
    return obj


def is_breached(c, now=None):
    return c["status"] != "RESOLVED" and datetime.fromisoformat(c["slaDueAt"]) < (now or now_utc())


def load_seed():
    data = json.loads(SEED_FILE.read_text())
    delta = now_utc() - datetime.fromisoformat(data["generatedAt"])
    STORE["complaints"] = {c["ticketId"]: shift_times(c, delta) for c in data["complaints"]}
    STORE["counter"] = 10482
    STORE["seedIds"] = set(STORE["complaints"])
    STORE["seedBreaches"] = sum(is_breached(c) for c in STORE["complaints"].values())


def all_complaints():
    return list(STORE["complaints"].values())


def get_or_404(ticket_id):
    c = STORE["complaints"].get(ticket_id.upper())
    if not c:
        raise HTTPException(404, f"Complaint {ticket_id} not found")
    return c


def public_view(c, user=None):
    v = {k: val for k, val in with_action(c).items() if k != "citizenId"}
    if user is not None:
        v["isMine"] = c.get("citizenId") == user["id"]
        v["canFeedback"] = v["isMine"] or user["role"] == "admin"
    return v


# ---------- Models ----------
class ComplaintIn(BaseModel):
    description: str = Field(min_length=10, max_length=2000)
    ward: int
    location: str = Field(min_length=2)
    latitude: float
    longitude: float
    image: Optional[str] = None
    hasVoice: bool = False

    @field_validator("ward")
    @classmethod
    def valid_ward(cls, v):
        if v not in WARD_NAMES:
            raise ValueError("Unknown ward")
        return v


class TriageIn(BaseModel):
    description: str = Field(min_length=3)
    ward: int = 17
    latitude: float = 22.7196
    longitude: float = 75.8577
    image: Optional[str] = None


class RouteIn(BaseModel):
    category: str
    ward: int = 17
    priority: int = 50


class EscalateIn(BaseModel):
    ticketId: str
    reason: Optional[str] = None


class StatusIn(BaseModel):
    status: str
    note: Optional[str] = None
    actor: str = "Demo Officer"


class OverrideIn(BaseModel):
    accept: bool = False
    category: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1, le=100)
    department: Optional[str] = None
    team: Optional[str] = None
    note: Optional[str] = None


class FeedbackIn(BaseModel):
    resolved: bool


# ---------- Routes ----------
@api.get("/")
def root():
    return {"name": "SwachhSetu 2.0", "mode": "Prototype / Mock Municipal System"}


@api.get("/meta")
def meta():
    return {
        "wards": [{"ward": w, "name": n} for w, n in WARD_NAMES.items()],
        "categories": [{"key": k, "label": v} for k, v in CATEGORY_LABELS.items()],
        "departments": sorted({d[0] for d in DEPARTMENTS.values()}),
        "teams": sorted({team_for(c, w) for c in DEPARTMENTS for w in WARD_NAMES}),
        "statuses": STATUSES,
    }


@api.get("/complaints/mine")
def my_complaints(user=Depends(get_current_user)):
    items = [c for c in all_complaints() if c.get("citizenId") == user["id"]]
    items.sort(key=lambda c: c["createdAt"], reverse=True)
    return [public_view(c, user) for c in items]


@api.post("/complaints")
def create_complaint(body: ComplaintIn, user=Depends(get_current_user)):
    ticket_id = f"SWC-2026-{STORE['counter']}"
    while ticket_id in STORE["complaints"]:
        STORE["counter"] += 1
        ticket_id = f"SWC-2026-{STORE['counter']}"
    STORE["counter"] += 1
    raw = {**body.model_dump(), "ticketId": ticket_id}
    c = build_complaint(raw, all_complaints())
    c["citizenId"] = user["id"]
    c["source"] = "citizen"
    STORE["complaints"][ticket_id] = c
    return public_view(c, user)


@api.get("/complaints")
def list_complaints(q: Optional[str] = None, category: Optional[str] = None, ward: Optional[int] = None,
                    status: Optional[str] = None, severity: Optional[str] = None):
    items = all_complaints()
    if q:
        ql = q.lower()
        items = [c for c in items if ql in c["ticketId"].lower() or ql in c["categoryLabel"].lower()
                 or ql in f"ward {c['ward']}" or ql in c["location"].lower()]
    if category:
        items = [c for c in items if c["category"] == category]
    if ward:
        items = [c for c in items if c["ward"] == ward]
    if status:
        items = [c for c in items if c["status"] == status]
    if severity:
        items = [c for c in items if c["severity"] == severity]
    items.sort(key=lambda c: c["priority"], reverse=True)
    return [public_view(c) for c in items]


@api.get("/complaints/{ticket_id}")
def get_complaint(ticket_id: str, user=Depends(optional_user)):
    return public_view(get_or_404(ticket_id), user)


@api.post("/triage")
def triage(body: TriageIn):
    result = triage_agent({**body.model_dump(), "ticketId": None}, all_complaints())
    return result


@api.post("/route")
def route(body: RouteIn):
    if body.category not in DEPARTMENTS:
        raise HTTPException(400, "Unknown category")
    return routing_agent(body.category, body.ward, body.priority)


@api.post("/escalate")
def escalate(body: EscalateIn, admin=Depends(require_admin)):
    c = get_or_404(body.ticketId)
    chain = c["ai"]["routing"]["escalationChain"]
    if c["escalationLevel"] >= len(chain) - 1:
        return {"complaint": public_view(c), "escalated": False, "message": "Already at Command Center"}
    action = action_agent(c)
    c["escalationLevel"] += 1
    level = chain[c["escalationLevel"]]
    c["audit"].append(audit_entry(now_utc(), "Action Agent", "ai",
                                  f"{body.reason or action['reason']} · Escalated to {level}"))
    return {"complaint": public_view(c), "escalated": True, "level": level, "action": action}


@api.post("/complaints/{ticket_id}/status")
def update_status(ticket_id: str, body: StatusIn, admin=Depends(require_admin)):
    c = get_or_404(ticket_id)
    body.actor = admin["name"] or "Officer"
    if body.status not in STATUSES:
        raise HTTPException(400, "Invalid status")
    c["status"] = body.status
    c["resolvedAt"] = now_utc().isoformat() if body.status == "RESOLVED" else None
    msg = f"Status → {body.status.replace('_', ' ')}" + (f" · {body.note}" if body.note else "")
    c["audit"].append(audit_entry(now_utc(), body.actor, "officer", msg))
    return public_view(c)


@api.post("/complaints/{ticket_id}/override")
def override(ticket_id: str, body: OverrideIn, admin=Depends(require_admin)):
    c = get_or_404(ticket_id)
    t = now_utc()
    if body.accept:
        c["officerDecision"] = {"accepted": True, "category": c["ai"]["triage"]["category"],
                                "priority": c["ai"]["triage"]["priority"],
                                "department": c["ai"]["routing"]["department"], "team": c["ai"]["routing"]["team"],
                                "note": body.note or "AI recommendation accepted", "officer": "Demo Officer",
                                "timestamp": t.isoformat()}
        c["audit"].append(audit_entry(t, "Demo Officer", "officer", "Officer accepted AI recommendation"))
        return public_view(c)

    if body.category and body.category not in DEPARTMENTS:
        raise HTTPException(400, "Unknown category")
    category = body.category or c["category"]
    priority = body.priority or c["priority"]
    department = body.department or (DEPARTMENTS[category][0] if body.category else c["department"])
    team = body.team or (team_for(category, c["ward"]) if body.category else c["team"])
    changes = [f"{k}: {old} → {new}" for k, old, new in
               [("Category", c["categoryLabel"], CATEGORY_LABELS[category]), ("Priority", c["priority"], priority),
                ("Department", c["department"], department), ("Team", c["team"], team)] if old != new]
    c.update({"category": category, "categoryLabel": CATEGORY_LABELS[category], "priority": priority,
              "priorityClass": priority_class(priority), "department": department, "team": team,
              "severity": "critical" if priority >= 95 else "high" if priority >= 75 else "medium" if priority >= 50 else "low"})
    if body.category:
        c["ai"]["routing"]["escalationChain"] = escalation_chain(category)
    c["officerDecision"] = {"accepted": False, "category": category, "priority": priority, "department": department,
                            "team": team, "note": body.note or "", "officer": "Demo Officer", "timestamp": t.isoformat()}
    c["audit"].append(audit_entry(t, "Demo Officer", "officer",
                                  "Officer override · " + ("; ".join(changes) or "no field changes")
                                  + (f" · Note: {body.note}" if body.note else "")))
    return public_view(c)


@api.post("/complaints/{ticket_id}/feedback")
def feedback(ticket_id: str, body: FeedbackIn, user=Depends(get_current_user)):
    c = get_or_404(ticket_id)
    if c.get("citizenId") != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Only the citizen who reported this can give feedback")
    c["feedback"] = {"resolved": body.resolved, "timestamp": now_utc().isoformat()}
    if body.resolved:
        c["status"] = "RESOLVED"
        c["resolvedAt"] = c["resolvedAt"] or now_utc().isoformat()
        c["audit"].append(audit_entry(now_utc(), c["citizenRef"], "citizen", "Citizen confirmed issue resolved"))
        return {"complaint": public_view(c), "action": action_agent(c)}
    action = action_agent(c, feedback=False)
    c["audit"].append(audit_entry(now_utc(), c["citizenRef"], "citizen", "Citizen reported issue NOT resolved"))
    c["audit"].append(audit_entry(now_utc(), "Action Agent", "ai", action["recommendation"]))
    return {"complaint": public_view(c), "action": action}


@api.post("/complaints/{ticket_id}/simulate-breach")
def simulate_breach(ticket_id: str, admin=Depends(require_admin)):
    c = get_or_404(ticket_id)
    c["slaDueAt"] = (now_utc() - timedelta(minutes=12)).isoformat()
    if c["status"] == "RESOLVED":
        c["status"] = "IN_PROGRESS"
    c["audit"].append(audit_entry(now_utc(), "Demo Controller", "system", "Simulated SLA breach (demo)"))
    return public_view(c)


@api.get("/dashboard")
def dashboard(admin=Depends(require_admin)):
    now = now_utc()
    items = all_complaints()
    new = [c for c in items if c["ticketId"] not in STORE["seedIds"]]
    breached = sum(is_breached(c, now) for c in items)
    kpis = {
        "total": DEMO_KPIS["total"] + len(new),
        "pending": DEMO_KPIS["pending"] + sum(c["status"] != "RESOLVED" for c in new),
        "highPriority": DEMO_KPIS["highPriority"] + sum(c["priority"] >= 75 and c["status"] != "RESOLVED" for c in new),
        "resolvedToday": DEMO_KPIS["resolvedToday"] + sum(c["status"] == "RESOLVED" for c in new),
        "slaBreaches": max(0, DEMO_KPIS["slaBreaches"] + breached - STORE["seedBreaches"]),
    }
    queue = sorted((c for c in items if c["status"] != "RESOLVED"), key=lambda c: c["priority"], reverse=True)
    inbox = sorted((c for c in new if c["status"] != "RESOLVED"), key=lambda c: c["createdAt"], reverse=True)
    return {"kpis": kpis, "label": "Demo Metrics", "queue": [public_view(c) for c in queue],
            "inbox": [public_view(c) for c in inbox],
            "liveOpen": len(queue), "liveBreached": breached, "timestamp": now.isoformat()}


@api.get("/hotspots")
def hotspots(admin=Depends(require_admin)):
    return insight_agent(all_complaints())


@api.get("/duplicates")
def duplicates(ticketId: Optional[str] = None, admin=Depends(require_admin)):
    items = all_complaints()
    if ticketId:
        c = get_or_404(ticketId)
        return detect_duplicates(c["category"], c["latitude"], c["longitude"], items, c["ticketId"])
    clusters, seen = [], set()
    for c in sorted(items, key=lambda x: x["priority"], reverse=True):
        if c["ticketId"] in seen or c["status"] == "RESOLVED":
            continue
        d = detect_duplicates(c["category"], c["latitude"], c["longitude"], items, c["ticketId"])
        if d["count"]:
            ids = [c["ticketId"]] + [m["ticketId"] for m in d["matches"]]
            seen.update(ids)
            clusters.append({"lead": c["ticketId"], "category": c["categoryLabel"], "ward": c["ward"],
                             "tickets": ids, "similarity": d["similarity"], "recommendation": d["recommendation"]})
    return {"clusters": clusters}


@api.post("/demo/reset")
def reset(admin=Depends(require_admin)):
    load_seed()
    return {"ok": True, "count": len(STORE["complaints"])}


load_seed()
app.include_router(api)
app.include_router(auth_router)
ALLOWED_ORIGINS = [os.environ["FRONTEND_URL"], "http://localhost:3000"]
ORIGIN_REGEX = os.environ["CORS_ORIGIN_REGEX"]


def origin_ok(origin):
    return origin in ALLOWED_ORIGINS or re.fullmatch(ORIGIN_REGEX, origin) is not None


@app.on_event("startup")
async def startup():
    await init_auth()


@app.middleware("http")
async def check_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and origin and not origin_ok(origin):
        logging.warning("Blocked origin %s", origin)
        return JSONResponse({"detail": "Origin not allowed"}, status_code=403)
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO)
