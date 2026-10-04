"""Agent pipeline: Understand -> Prioritize -> Detect Duplicates -> Route -> Act."""
import hashlib
from datetime import datetime, timezone, timedelta

from agents import triage_agent, routing_agent, action_agent, WARD_NAMES

CITY = "Indore, Madhya Pradesh"


def audit_entry(time, actor, kind, message):
    return {"time": time.isoformat(), "actor": actor, "type": kind, "message": message}


def build_complaint(raw, existing, created=None, auto_assign=True):
    created = created or datetime.now(timezone.utc)
    triage = triage_agent(raw, existing)
    routing = routing_agent(triage["category"], raw["ward"], triage["priority"])
    dups = triage.pop("duplicates")
    t1 = created + timedelta(minutes=1)
    citizen = "Citizen #" + hashlib.sha1(raw["ticketId"].encode()).hexdigest()[:5].upper()
    for block in (triage, routing, dups):
        block["timestamp"] = t1.isoformat()

    audit = [
        audit_entry(created, citizen, "citizen", "Complaint submitted" + (" (voice)" if raw.get("hasVoice") else "")),
        audit_entry(t1, "Triage Agent", "ai",
                    f"AI recommended {triage['categoryLabel']} · Priority {triage['priority']} ({triage['severity'].upper()})"),
        audit_entry(t1, "Triage Agent", "ai",
                    f"Duplicate check: {dups['count']} similar complaint(s) within 300 m"),
        audit_entry(t1, "Routing Agent", "ai", f"AI recommended {routing['department']} → {routing['team']}"),
    ]
    status = "SUBMITTED"
    if auto_assign:
        status = "ASSIGNED"
        audit.append(audit_entry(created + timedelta(minutes=2), "System", "system",
                                 f"Auto-assigned to {routing['team']} · Status → ASSIGNED"))

    ward = int(raw["ward"])
    return {
        "ticketId": raw["ticketId"],
        "category": triage["category"],
        "categoryLabel": triage["categoryLabel"],
        "description": raw["description"],
        "severity": triage["severity"],
        "priority": triage["priority"],
        "priorityClass": routing["priorityClass"],
        "confidence": triage["confidence"],
        "ward": ward,
        "wardName": WARD_NAMES.get(ward, f"Ward {ward}"),
        "location": raw["location"],
        "city": CITY,
        "department": routing["department"],
        "team": routing["team"],
        "status": status,
        "latitude": raw["latitude"],
        "longitude": raw["longitude"],
        "createdAt": created.isoformat(),
        "slaDueAt": (created + timedelta(hours=routing["slaHours"])).isoformat(),
        "slaHours": routing["slaHours"],
        "resolvedAt": None,
        "image": raw.get("image"),
        "hasVoice": bool(raw.get("hasVoice")),
        "citizenRef": citizen,
        "ai": {"triage": triage, "routing": routing, "duplicates": dups},
        "officerDecision": None,
        "escalationLevel": 0,
        "feedback": None,
        "audit": audit,
    }


def with_action(c):
    return {**c, "ai": {**c["ai"], "action": action_agent(c)}}
