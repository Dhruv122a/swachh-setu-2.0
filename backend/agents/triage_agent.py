"""Triage Agent: deterministic mock AI that classifies, scores and de-duplicates complaints."""
import math
import re
from datetime import datetime, timezone

CATEGORY_KEYWORDS = {
    "garbage": ["garbage", "waste", "trash", "dump", "kachra", "litter", "bin", "overflow"],
    "sewage": ["sewage", "sewer", "manhole", "gutter", "foul smell"],
    "water": ["water leak", "leakage", "pipeline", "pipe burst", "pipe", "water supply", "tap"],
    "drainage": ["drain", "nala", "waterlogging", "clogged", "stagnant"],
    "pothole": ["pothole", "crater", "road broken", "damaged road", "gaddha"],
    "streetlight": ["streetlight", "street light", "lamp", "dark", "light not working", "flicker"],
}
CATEGORY_LABELS = {
    "garbage": "Garbage Overflow", "pothole": "Pothole", "water": "Water Leakage",
    "streetlight": "Streetlight Outage", "drainage": "Open / Clogged Drain", "sewage": "Sewage Overflow",
}
VISUAL_SIGNAL = {
    "garbage": "Visible waste accumulation", "pothole": "Visible road surface damage",
    "water": "Visible water discharge", "streetlight": "Non-functional lighting fixture",
    "drainage": "Visible drain blockage", "sewage": "Visible wastewater overflow",
}
HEALTH_RISK = {"garbage": 30, "sewage": 30, "drainage": 24, "water": 22, "pothole": 18, "streetlight": 14}
BASE_SEVERITY = {"garbage": 18, "sewage": 22, "drainage": 18, "water": 20, "pothole": 20, "streetlight": 15}
INTENSITY_WORDS = ["overflow", "burst", "accident", "deep", "huge", "flooding", "children", "unsafe", "skidding"]
PUBLIC_PLACES = ["park", "market", "school", "hospital", "bus", "temple", "main road", "college", "square", "mall"]
WARD_DENSITY = {5: 8, 9: 7, 12: 8, 17: 8, 21: 8, 24: 8}
NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def distance_m(lat1, lng1, lat2, lng2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def classify(text):
    scores = {c: sum(1 for k in kws if k in text) for c, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=lambda c: scores[c])
    return (best, scores[best]) if scores[best] > 0 else ("garbage", 0)


def duration_points(text):
    if "week" in text or "month" in text:
        return 20
    m = re.search(r"(\d+|one|two|three|four|five|six|seven)\s+days?", text)
    if m:
        days = int(m.group(1)) if m.group(1).isdigit() else NUMBER_WORDS[m.group(1)]
        return 20 if days >= 3 else 12
    if "yesterday" in text:
        return 12
    return 6


def detect_duplicates(category, lat, lng, others, exclude_id=None, radius=300):
    matches = []
    for o in others:
        if o["ticketId"] == exclude_id or o["category"] != category or o["status"] == "RESOLVED":
            continue
        d = distance_m(lat, lng, o["latitude"], o["longitude"])
        if d <= radius:
            matches.append({"ticketId": o["ticketId"], "distance": round(d), "similarity": round(97 - d / 7)})
    matches.sort(key=lambda m: m["distance"])
    count = len(matches)
    return {
        "count": count,
        "similarity": max((m["similarity"] for m in matches), default=0),
        "nearestDistance": matches[0]["distance"] if matches else None,
        "matches": matches,
        "recommendation": "Group as one civic incident while preserving individual citizen reports."
        if count else "No duplicates found. Treat as a new civic incident.",
        "timestamp": now_iso(),
    }


def triage_agent(complaint, existing=()):
    """Returns category, severity, priority (0-100), confidence (0-1), reason and scoring factors."""
    text = (complaint.get("description") or "").lower()
    category, hits = classify(text)
    ward = int(complaint.get("ward") or 17)
    public = any(p in text for p in PUBLIC_PLACES)
    dups = detect_duplicates(category, complaint["latitude"], complaint["longitude"], existing,
                             complaint.get("ticketId"))

    factors = [
        {"label": "Public health risk", "points": HEALTH_RISK[category]},
        {"label": "Severity", "points": BASE_SEVERITY[category] + (7 if any(w in text for w in INTENSITY_WORDS) else 0)},
        {"label": "Duration", "points": duration_points(text)},
        {"label": "Location density", "points": min(10, WARD_DENSITY.get(ward, 7) + (2 if public else 0))},
        {"label": "Nearby complaints", "points": min(9, 3 * dups["count"])},
    ]
    priority = max(10, min(99, sum(f["points"] for f in factors)))
    severity = "critical" if priority >= 95 else "high" if priority >= 75 else "medium" if priority >= 50 else "low"

    reason_parts = [VISUAL_SIGNAL[category]]
    if factors[2]["points"] >= 20:
        reason_parts.append("prolonged duration")
    if public:
        reason_parts.append("public location")
    if dups["count"]:
        reason_parts.append(f"{dups['count']} nearby reports")

    return {
        "category": category,
        "categoryLabel": CATEGORY_LABELS[category],
        "severity": severity,
        "priority": priority,
        "confidence": round(min(0.97, 0.82 + 0.06 * min(hits, 2)), 2),
        "reason": " + ".join(reason_parts) + ".",
        "factors": factors,
        "imageAnalyzed": bool(complaint.get("image")),
        "duplicates": dups,
        "timestamp": now_iso(),
    }
