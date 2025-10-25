import os
import base64
import json
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.messages import AIMessage, ToolMessage

from backend.services.llm_clients import analyze_image_with_query
from backend.config import (
    GROQ_API_KEY,
    LLM_MODEL_DOCTOR,
)
from backend.tools.actions import recommend_doctor_by_specialty

# --- MODIFIED: Updated System Prompt ---
# The prompt now instructs the agent to combine the analysis AND tool results
# into a single, final response.
SYSTEM_PROMPT_DOCTOR = """
You are a professional AI doctor assistant. Your role is to analyze symptoms and recommend a specialist.
This is a multi-step process:

1.  First, analyze the user's symptoms and determine the *single* most relevant medical specialty (e.g., 'Cardiology').
2.  Second, call the `recommend_doctor_by_specialty_tool` with that specialty.
3.  Third, *after* you get the tool's response (which will be a JSON string), you MUST formulate your *final answer*.
4.  Your final answer MUST include:
    a) Your brief analysis of the symptoms (2-3 sentences).
    b) The list of doctors and their details (name, specialty, location, contact) if the tool found any, using the "message" from the tool.
    c) The 'not_found' or 'error' message from the tool if no doctors were found.

**CRITICAL:** Do *not* respond with just the analysis. You must wait for the tool output and combine *everything* into one single, final response. Format the doctor list clearly with new lines.

Example flow:
User: "i have chest pain"
You (internal thought): Specialty is Cardiology. I must call the tool.
You (internal action): call recommend_doctor_by_specialty_tool('Cardiology')
[Tool returns: {"status": "found", "message": "Okay, based on your query, I recommend consulting a specialist in Cardiology. Here are 2 doctors I found near Rajpur Sonarpur:", "doctors": [{"name": "Dr. Priya Sharma", "specialty": "Cardiology", "location": "Rajpur Sonarpur Clinic A", "contact": "9876543210"}, {"name": "Dr. Vikram Singh", ...}]}]
You (final text response): "Chest pain can be a serious symptom, potentially related to your heart or other conditions. It is very important to get a professional evaluation.

Okay, based on your query, I recommend consulting a specialist in Cardiology. Here are 2 doctors I found near Rajpur Sonarpur:
- Dr. Priya Sharma
  Specialty: Cardiology
  Location: Rajpur Sonarpur Clinic A
  Contact: 9876543210
- Dr. Vikram Singh
  Specialty: Cardiology
  Location: Apollo Clinic, Garia
  Contact: 9234567890"
"""

from backend.services.llm_clients import encode_image


@tool
def recommend_doctor_by_specialty_tool(specialty: str) -> str:
    """
    Finds doctors based on their medical specialty (e.g., Cardiology, Dermatology)
    by querying the database. Use this AFTER providing an initial assessment and
    determining the most relevant specialty based on the user's query or symptoms.
    Input MUST be a single specialty name (like 'Cardiology').
    """
    return recommend_doctor_by_specialty(specialty)


# Langchain setup
tools = [recommend_doctor_by_specialty_tool]
llm = ChatGroq(
    model=LLM_MODEL_DOCTOR,
    temperature=0.2,
    groq_api_key=GROQ_API_KEY,
)
general_doctor_agent = create_react_agent(llm, tools=tools)


# --- MODIFIED: Simplified Parser ---
# This parser just finds the tool call name and the *final* AI message.
# The agent itself is now responsible for combining the text.
def parse_response(stream):
    """Parses LangGraph/LangChain stream to extract tool calls and the final text response."""
    tool_called_name = "None"
    final_response = None

    for s in stream:
        tool_data = s.get("tools")
        if tool_data:
            tool_messages = tool_data.get("messages")
            if tool_messages and isinstance(tool_messages, list):
                for msg in tool_messages:
                    # Capture the *name* of the tool called
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        tool_called_name = msg.tool_calls[0].get("name")

        agent_data = s.get("agent")
        if agent_data:
            messages = agent_data.get("messages")
            if messages and isinstance(messages, list):
                for msg in messages:
                    # The *last* AIMessage with content is the final response
                    if isinstance(msg, AIMessage) and msg.content:
                        final_response = msg.content

    if not final_response:
        final_response = "I encountered an issue processing your request."

    # --- MODIFIED: Return only tool name and the final, combined response ---
    # This matches what backend/main.py expects.
    return tool_called_name, final_response
