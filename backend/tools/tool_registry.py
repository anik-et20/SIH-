"""
DisasterGuard AI Tool Registry
Defines official schemas and dispatch routing for LLM function calls.
"""

from typing import List, Dict, Any

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Fetch live weather observations from IMD official stations or meteorological sensors.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City, district, or place name (e.g. Mumbai, Shimla, Chennai, Delhi, Guwahati)"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_official_cap_alerts",
            "description": "Fetch official Common Alerting Protocol (CAP) emergency disaster warnings issued by NDMA, IMD, or SDMA.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "District or region name to check active emergency warnings for."
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_flood_risk",
            "description": "Calculate physics-informed urban flash flood and riverine inundation risk for a given location and rainfall accumulation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or district location"
                    },
                    "rainfall_24h_mm": {
                        "type": "number",
                        "description": "24-hour accumulated rainfall in millimeters"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_landslide_risk",
            "description": "Compute slope instability and landslide hazard index for hilly/mountainous locations based on slope degree and precipitation intensity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Hilly location (e.g. Shimla, Dehradun, Wayanad, Darjeeling)"
                    },
                    "rainfall_24h_mm": {
                        "type": "number",
                        "description": "24-hour accumulated rainfall in millimeters"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_emergency_helplines",
            "description": "Get official toll-free emergency helpline numbers for National/State Disaster Management Authorities, NDRF, and local control rooms.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "State name (e.g. Maharashtra, Tamil Nadu, Himachal Pradesh, Assam, Delhi)"
                    }
                },
                "required": ["state"]
            }
        }
    }
]

def get_tool_definitions() -> List[Dict[str, Any]]:
    return TOOL_DEFINITIONS
