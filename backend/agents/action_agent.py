"""Action Agent: watches SLA and citizen feedback, recommends escalation steps."""
from datetime import datetime, timezone


def action_agent(complaint, now=None, feedback=None):
    now = now or datetime.now(timezone.utc)
    chain = complaint["ai"]["routing"]["escalationChain"]
    level = complaint.get("escalationLevel", 0)
    next_level = chain[min(level + 1, len(chain) - 1)]
    due = datetime.fromisoformat(complaint["slaDueAt"])
    created = datetime.fromisoformat(complaint["createdAt"])
    remaining = (due - now).total_seconds() / 60
    window = max(1, (due - created).total_seconds() / 60)
    base = {"timestamp": now.isoformat(), "currentLevel": chain[level], "nextLevel": next_level}

    if feedback is False:
        return {**base, "state": "CITIZEN_REJECTED", "action": "REOPEN_AND_ESCALATE", "confidence": 0.91,
                "recommendation": f"Reopen ticket and escalate to {next_level}.",
                "reason": "Citizen reported the issue is still not resolved after closure."}
    if complaint["status"] == "RESOLVED":
        return {**base, "state": "RESOLVED", "action": "CLOSE", "confidence": 0.95,
                "recommendation": "Close ticket and request citizen confirmation.",
                "reason": "Field team marked the issue as resolved."}
    if remaining < 0:
        return {**base, "state": "SLA_BREACHED", "action": "ESCALATE", "confidence": 0.93,
                "overdueMinutes": round(-remaining),
                "recommendation": f"Escalate to {next_level}.",
                "reason": "Complaint has exceeded expected response time."}
    if remaining < max(60, window * 0.25):
        return {**base, "state": "SLA_RISK", "action": "NOTIFY_SUPERVISOR", "confidence": 0.86,
                "recommendation": f"Alert {chain[1]} — SLA at risk.",
                "reason": f"Only {round(remaining)} minutes remain in the response window."}
    return {**base, "state": "ON_TRACK", "action": "MONITOR", "confidence": 0.9,
            "recommendation": "Continue monitoring. No action needed.",
            "reason": "Complaint is within its expected response time."}
