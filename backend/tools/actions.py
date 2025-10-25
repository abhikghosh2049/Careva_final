import os
from twilio.rest import Client
import json
from backend.database import find_doctors_by_specialty
from backend.config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    EMERGENCY_CONTACT,
)


# Tool 1: Emergency Call (for suicidal/crisis detection)
def emergency_call_tool() -> None:
    """
    Places an emergency call to the safety helpline via Twilio.
    This function is executed by the agent upon recognizing a crisis signal.
    """
    if not all(
        [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, EMERGENCY_CONTACT]
    ):
        print("Twilio credentials not set. Skipping real emergency call.")
        return

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    try:
        call = client.calls.create(
            to=EMERGENCY_CONTACT,
            from_=TWILIO_FROM_NUMBER,
            url="http://demo.twilio.com/docs/voice.xml",  # Your recorded crisis message TwiML
        )
        print(f"Emergency call initiated to {EMERGENCY_CONTACT}. Call SID: {call.sid}")
    except Exception as e:
        print(f"Twilio Call Error: {e}")


# Tool 2: Therapist Finder (for resource lookup)
def find_nearby_therapists_by_location(location: str) -> str:
    """
    Finds and returns a list of licensed therapists near the specified location.
    The list is returned as a string for the LLM to format into a final response.
    """
    # NOTE: In a real app, this would query a database or API (like Zocdoc, etc.)
    return (
        f"Here are some local mental health resources near {location}:\n"
        "- MindCare Counseling Center - +1 (555) 222-3333\n"
        "- Dr. Ayesha Kapoor (Clinical Psychologist) - +1 (555) 123-4567\n"
        "- National Crisis Hotline: 988 (Available 24/7)"
    )


def recommend_doctor_by_specialty(specialty: str) -> str:
    """
    Finds doctors based on their medical specialty (e.g., Cardiology, Dermatology)
    by querying the Firestore database. Returns a JSON string listing
    matching doctors and their contact details.
    """
    print(f"Tool called: recommend_doctor_by_specialty with specialty='{specialty}'")
    try:
        doctors = find_doctors_by_specialty(specialty)

        if not doctors:
            return json.dumps(
                {
                    "status": "not_found",
                    "message": f"I couldn't find any doctors specializing in {specialty} near Rajpur Sonarpur in our current database.",
                    "doctors": [],
                }
            )

        message = f"Okay, based on your query, I recommend consulting a specialist in {specialty}. Here are {len(doctors)} doctors I found near Rajpur Sonarpur:"
        return json.dumps({"status": "found", "message": message, "doctors": doctors})

    except Exception as e:
        print(f"Error in recommend_doctor_by_specialty tool: {e}")
        return json.dumps(
            {
                "status": "error",
                "message": f"Sorry, I encountered an error while searching for doctors specializing in {specialty}.",
                "doctors": [],
            }
        )
