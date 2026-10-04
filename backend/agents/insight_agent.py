"""Insight Agent: turns complaint data into hotspots, trends and resource recommendations."""
from collections import Counter
from datetime import datetime, timezone, timedelta

from .triage_agent import CATEGORY_LABELS

WARD_NAMES = {5: "Palasia", 9: "Vijay Nagar", 12: "Sudama Nagar", 17: "Shivaji Nagar", 21: "Bhawarkuan", 24: "Khajrana"}
# Historical weekly baselines (mock): (previous week, this week before live reports)
HISTORY = {
    (17, "garbage"): (25, 29), (12, "water"): (19, 21), (9, "streetlight"): (17, 18),
    (21, "sewage"): (14, 14), (5, "pothole"): (16, 16), (24, "drainage"): (12, 12),
}
RESOURCES = {
    "garbage": ("an additional sanitation vehicle", "between 7 AM and 11 AM"),
    "water": ("a standby leak-repair crew", "between 6 AM and 10 AM"),
    "streetlight": ("an electrical maintenance van", "between 6 PM and 10 PM"),
    "sewage": ("a jetting machine and sewer crew", "between 8 AM and 12 PM"),
    "pothole": ("a cold-mix patching unit", "between 11 PM and 5 AM"),
    "drainage": ("a desilting crew", "between 7 AM and 11 AM"),
}
DAILY_BASE = [14, 17, 15, 19, 22, 18, 16, 21, 24, 20, 23, 26, 25, 28]
RESOLUTION_HOURS = {"garbage": 5.2, "pothole": 26.4, "water": 7.8, "streetlight": 18.5, "drainage": 14.1, "sewage": 9.6}
SLA_BREACH_BASE = {5: 6, 9: 9, 12: 11, 17: 14, 21: 8, 24: 7}


def insight_agent(complaints, now=None):
    now = now or datetime.now(timezone.utc)
    pair_counts = Counter((c["ward"], c["category"]) for c in complaints)

    trends = []
    for (ward, cat), (prev, base) in HISTORY.items():
        curr = base + pair_counts.get((ward, cat), 0)
        trends.append({"ward": ward, "wardName": WARD_NAMES[ward], "category": cat,
                       "categoryLabel": CATEGORY_LABELS[cat], "previous": prev, "current": curr,
                       "change": round((curr / prev - 1) * 100)})
    trends.sort(key=lambda t: t["change"], reverse=True)

    top = trends[0]
    resource, window = RESOURCES[top["category"]]
    open_in_ward = sum(1 for c in complaints if c["ward"] == top["ward"] and c["status"] != "RESOLVED")
    recommendation = {
        "title": "AI Resource Recommendation",
        "recommendation": f"Deploy {resource} to Ward {top['ward']} {window}.",
        "reason": f"Repeated {top['categoryLabel'].lower()} complaints + high complaint density "
                  f"({open_in_ward} open) + delayed resolution.",
        "confidence": round(min(0.95, 0.80 + top["change"] / 350), 2),
        "ward": top["ward"],
        "timestamp": now.isoformat(),
    }

    by_category = Counter(c["category"] for c in complaints)
    by_ward = Counter(c["ward"] for c in complaints)
    today = now.date()
    daily = []
    for i, base in enumerate(DAILY_BASE):
        day = today - timedelta(days=13 - i)
        live = sum(1 for c in complaints if datetime.fromisoformat(c["createdAt"]).date() == day)
        daily.append({"date": day.strftime("%d %b"), "complaints": base + live})

    breaches = Counter(c["ward"] for c in complaints
                       if c["status"] != "RESOLVED" and datetime.fromisoformat(c["slaDueAt"]) < now)
    hotspots = []
    for ward, name in WARD_NAMES.items():
        open_count = sum(1 for c in complaints if c["ward"] == ward and c["status"] != "RESOLVED")
        risk = min(99, open_count * 12 + breaches.get(ward, 0) * 15 + (20 if ward == top["ward"] else 0))
        hotspots.append({"ward": ward, "wardName": name, "open": open_count, "risk": risk,
                         "level": "HOTSPOT" if risk >= 60 else "WATCH" if risk >= 35 else "NORMAL"})

    return {
        "trends": trends,
        "recommendation": recommendation,
        "hotspots": sorted(hotspots, key=lambda h: h["risk"], reverse=True),
        "byCategory": [{"category": CATEGORY_LABELS[k], "key": k, "count": by_category.get(k, 0) * 6 + 4}
                       for k in CATEGORY_LABELS],
        "byWard": [{"ward": f"W{w}", "name": n, "count": by_ward.get(w, 0) * 5 + 6} for w, n in WARD_NAMES.items()],
        "daily": daily,
        "resolutionTime": [{"category": CATEGORY_LABELS[k], "hours": v} for k, v in RESOLUTION_HOURS.items()],
        "slaBreachRate": [{"ward": f"W{w}", "rate": SLA_BREACH_BASE[w] + breaches.get(w, 0) * 2} for w in WARD_NAMES],
        "timestamp": now.isoformat(),
    }
