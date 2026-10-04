"""Routing Agent: deterministic mapping from issue category to department, team and SLA."""
from datetime import datetime, timezone

DEPARTMENTS = {
    "garbage": ("Solid Waste Management", "Sanitation Team", "Sanitation Supervisor", 0.96,
                "the detected issue involves accumulated municipal waste in a public area"),
    "pothole": ("Public Works — Roads", "Road Maintenance Crew", "Roads Supervisor", 0.93,
                "the detected issue involves damage to a municipal road surface"),
    "water": ("Water Supply Department", "Water Works Team", "Water Works Supervisor", 0.95,
              "the detected issue involves leakage from the municipal water supply network"),
    "streetlight": ("Electrical & Street Lighting", "Electrical Team", "Electrical Supervisor", 0.97,
                    "the detected issue involves a non-functional municipal street light"),
    "drainage": ("Storm Water Drainage", "Drainage Team", "Drainage Supervisor", 0.90,
                 "the detected issue involves a blocked or open storm water drain"),
    "sewage": ("Sewerage & Sanitation", "Sewer Line Team", "Sewerage Supervisor", 0.92,
               "the detected issue involves overflow from the underground sewer network"),
}
SLA_HOURS = {"P1": 4, "P2": 12, "P3": 48}


def priority_class(priority):
    return "P1" if priority >= 85 else "P2" if priority >= 65 else "P3"


def escalation_chain(category):
    return ["Ward Team", DEPARTMENTS[category][2], "Ward Officer", "Command Center"]


def team_for(category, ward):
    return f"Ward {ward} {DEPARTMENTS[category][1]}"


def routing_agent(category, ward, priority):
    dept, _, _, confidence, why = DEPARTMENTS[category]
    pclass = priority_class(priority)
    return {
        "department": dept,
        "team": team_for(category, ward),
        "priorityClass": pclass,
        "slaHours": SLA_HOURS[pclass],
        "confidence": confidence,
        "escalationChain": escalation_chain(category),
        "reason": f"{dept} was selected because {why}.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
