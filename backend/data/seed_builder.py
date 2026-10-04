"""Regenerates data/complaints.json from the raw demo reports below: `python data/seed_builder.py`."""
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline import build_complaint, audit_entry  # noqa: E402
from agents import triage_agent  # noqa: E402

# ticketId, ward, lat, lng, location, description, ageMinutes, status, escalationLevel
RAW = [
    ("10321", 17, 22.7225, 75.8545, "Bombay Bazaar Road, near Ward 17 office", "Garbage dump not cleared for a week near the market, overflowing onto the main road with foul smell.", 420, "IN_PROGRESS", 1),
    ("10391", 17, 22.7199, 75.8577, "Shivaji Nagar Community Park, Gate 2", "Garbage bins overflowing near the park gate for two days, stray dogs spreading waste on the footpath.", 200, "ASSIGNED", 0),
    ("10397", 17, 22.7190, 75.8582, "Shivaji Nagar Main Road, opp. Community Hall", "Waste bin overflowing near the community hall, plastic waste blocking the footpath.", 150, "INSPECTION_SCHEDULED", 0),
    ("10402", 17, 22.7208, 75.8570, "Lane 4, Shivaji Nagar", "Household garbage dumped in the open lane near the park for three days, not collected by the door-to-door vehicle.", 90, "SUBMITTED", 0),
    ("10335", 12, 22.6995, 75.8345, "Sudama Nagar Sector D, near water tank", "Water pipeline leakage on the main road, clean water wasting since morning and road getting slippery.", 200, "IN_PROGRESS", 0),
    ("10344", 12, 22.6982, 75.8362, "Sudama Nagar Gate No. 3", "Pipe burst near the school gate, water flooding the road and supply disrupted for nearby houses.", 690, "ASSIGNED", 0),
    ("10352", 9, 22.7540, 75.8925, "Vijay Nagar Square, Scheme 54", "Three streetlights not working near the bus stop for two days, area completely dark at night.", 500, "ASSIGNED", 0),
    ("10358", 9, 22.7525, 75.8950, "Scheme 74, Sector C", "Street light pole flickering and dark stretch near the park, unsafe for women walking at night.", 60, "SUBMITTED", 0),
    ("10366", 9, 22.7548, 75.8941, "Vijay Nagar, C21 Mall service road", "Open drain clogged with plastic, stagnant water and mosquitoes near the main road for a week.", 780, "INSPECTION_SCHEDULED", 0),
    ("10371", 5, 22.7245, 75.8822, "Palasia Square, AB Road", "Deep pothole in the middle of AB Road near Palasia Square, two-wheelers skidding, accident risk.", 150, "IN_PROGRESS", 0),
    ("10377", 5, 22.7232, 75.8845, "Old Palasia, near Geeta Bhawan", "Road broken with multiple potholes after rain, damaged road near the hospital entrance.", 700, "ASSIGNED", 0),
    ("10383", 21, 22.6935, 75.8672, "Bhawarkuan Square, near Holkar College", "Sewage overflowing from manhole near the college for three days, foul smell and dirty water on the road.", 340, "IN_PROGRESS", 0),
    ("10388", 24, 22.7345, 75.9042, "Khajrana Ganesh Mandir Road", "Sewer line choked, gutter water overflowing near the temple road, devotees facing difficulty.", 90, "ASSIGNED", 0),
    ("10409", 24, 22.7330, 75.9060, "Khajrana Square, Ring Road", "Waterlogging due to clogged drain near the market, shops affected since yesterday.", 45, "SUBMITTED", 0),
    ("10415", 5, 22.7250, 75.8838, "56 Dukan, New Palasia", "Food stall waste and litter piling up behind 56 Dukan, bins overflowing every evening.", 30, "SUBMITTED", 0),
    ("10421", 21, 22.6922, 75.8690, "Bhawarkuan to Navlakha Road", "Large pothole near the bus stand causing traffic jam during peak hours.", 400, "ASSIGNED", 0),
    ("10428", 24, 22.7352, 75.9038, "Khajrana Main Road, near Masjid", "Water supply line leakage, low pressure in nearby houses for two days.", 1000, "RESOLVED", 0),
    ("10433", 21, 22.6940, 75.8665, "Bhawarkuan, Tower Square lane", "Streetlight not working outside the coaching centres, students walk in the dark.", 1500, "RESOLVED", 0),
    ("10440", 12, 22.7000, 75.8338, "Sudama Nagar, Annapurna Road", "Drain overflowing on the road after light rain, stagnant water near houses.", 520, "IN_PROGRESS", 0),
    ("10446", 17, 22.7185, 75.8565, "Shivaji Nagar, behind Govt. School", "Manhole cover broken and sewage leaking near the school, children at risk.", 70, "ASSIGNED", 0),
    ("10452", 24, 22.7338, 75.9065, "Khajrana, near Vegetable Market", "Vegetable market waste dumped on the road, cattle gathering and traffic blocked.", 260, "ASSIGNED", 0),
    ("10458", 9, 22.7520, 75.8930, "Vijay Nagar, Scheme 54 PU4", "Pothole filled with water on the service road, two-wheeler accident reported yesterday.", 20, "SUBMITTED", 0),
    ("10464", 5, 22.7236, 75.8818, "Palasia, near Industry House", "Pipeline leak near the hospital, water wasting continuously.", 1400, "RESOLVED", 0),
    ("10470", 12, 22.6978, 75.8355, "Sudama Nagar, Sector E park", "Streetlight not working near the park since a week.", 3000, "RESOLVED", 0),
]
IMAGES = {c: f"/images/{c}.jpg" for c in ["garbage", "pothole", "water", "streetlight", "drainage", "sewage"]}
STEPS = [("INSPECTION_SCHEDULED", 0.4, "Inspection scheduled by field team"),
         ("IN_PROGRESS", 0.7, "Status → IN PROGRESS"), ("RESOLVED", 0.9, "Status → RESOLVED")]


def main():
    now = datetime.now(timezone.utc)
    raws = []
    for tid, ward, lat, lng, loc, desc, age, status, level in RAW:
        r = {"ticketId": f"SWC-2026-{tid}", "ward": ward, "latitude": lat, "longitude": lng,
             "location": loc, "description": desc, "status": status, "age": age, "level": level}
        r["category"] = triage_agent(r)["category"]
        r["image"] = IMAGES[r["category"]]
        raws.append(r)

    out = []
    for r in raws:
        created = now - timedelta(minutes=r["age"])
        c = build_complaint(r, raws, created, auto_assign=r["status"] != "SUBMITTED")
        order = [s[0] for s in STEPS]
        for st, frac, msg in STEPS:
            if r["status"] in order and order.index(r["status"]) >= order.index(st):
                t = created + timedelta(minutes=r["age"] * frac)
                c["audit"].append(audit_entry(t, c["team"], "officer", msg))
                if st == "RESOLVED":
                    c["resolvedAt"] = t.isoformat()
        c["status"] = r["status"]
        if r["level"]:
            c["escalationLevel"] = r["level"]
            c["audit"].append(audit_entry(now - timedelta(minutes=30), "Action Agent", "ai",
                                          f"SLA breached · Escalated to {c['ai']['routing']['escalationChain'][r['level']]}"))
        c["audit"].sort(key=lambda a: a["time"])
        out.append(c)

    path = Path(__file__).parent / "complaints.json"
    path.write_text(json.dumps({"generatedAt": now.isoformat(), "complaints": out}, indent=2, ensure_ascii=False))
    print(f"Wrote {len(out)} complaints to {path}")


if __name__ == "__main__":
    main()
