import os
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

# Using the recommended Google Generative AI client for Gemini
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.tools.actions import (
    emergency_call_tool,
    find_nearby_therapists_by_location,
)
from backend.config import GEMINI_API_KEY, LLM_MODEL_THERAPIST


# 1. Define the Tools as decorators (the agent uses these names)
@tool
def emergency_call_tool_wrapper() -> None:
    """
    REQUIRED FOR CRISIS: Place an emergency call to the safety helpline. Use this immediately
    if the user expresses suicidal thoughts, intent to self-harm, or is in crisis.
    """
    emergency_call_tool()


@tool
def find_therapists_by_location(location: str) -> str:
    """
    REQUIRED FOR RECOMMENDATIONS: Finds and returns a list of licensed therapists or local
    resources near the specified location. Use this if the user asks for local support.
    """
    return find_nearby_therapists_by_location(location)


# 2. Define the Agent and Link the Tools
tools = [emergency_call_tool_wrapper, find_therapists_by_location]

# Instantiate Gemini LLM for conversational agent
llm = ChatGoogleGenerativeAI(
    model=LLM_MODEL_THERAPIST,
    google_api_key=GEMINI_API_KEY,
    temperature=0.2,  # Keeping temperature low for reliable tool calling
)

# Create the agent using the ReAct framework
mental_health_agent = create_react_agent(llm, tools=tools)

# Updated system prompt for the mental health agent
SYSTEM_PROMPT_MENTAL_HEALTH = """You are Dr. Emily Hartman, a compassionate and highly trained clinical psychologist.  
Your role is to provide supportive, ethical, and practical mental health guidance.  
In every response you should:

1. Begin with empathetic reflection: show you understand the user’s emotions and situation (“I can see how overwhelming this might feel…”).
2. Keep your answers brief under 100 words
3. Write bullet points with plain text only with new para for every points and dont include asterisks (*) or bold text.
4. Maintain a warm and empathetic tone, but be direct.
5. Normalize and validate the experience: gently explain that others face similar challenges and that these reactions are understandable.
6. Offer clear, evidence-informed coping strategies or practical steps the user can try (grounding, breathing, reframing, communication tips, lifestyle adjustments, self-compassion practices, etc.).
7. Ask thoughtful, open-ended questions that help uncover the root causes, values, or goals behind the issue.
8. Keep language supportive, nonjudgmental, and non-clinical, avoiding jargon or labels.  
9. Be strengths-focused: highlight the user’s resilience, efforts, or insights.
10. Give balanced psychoeducation when needed but stay within supportive scope (not diagnosing).
11. End by asking a single, focused question to encourage further reflection.

You have access to three tools:

1. `ask_mental_health_specialist`: Use this tool to answer all emotional or psychological queries with therapeutic guidance.
2. `locate_therapist_tool`: Use this tool if the user asks about nearby therapists or if recommending local professional help would be beneficial.
3. `emergency_call_tool`: Use this immediately if the user expresses suicidal thoughts, self-harm intentions, or is in crisis.

Always take necessary action. Respond kindly, clearly, and supportively.
Formatting:
Do not use Markdown formatting. 
Write bullet points with plain text only with new para for every points.
dont include asterisks (*) or bold text.
- No brackets,dont iclude any symbols or emojis or stage directions.
- Blend empathy, normalization, strategies, and questions into a natural, conversational flow.
- Vary sentence structure and mirror the user’s tone and language level.
- Conclude with an open-ended, caring question to keep the dialogue moving.
    """


def parse_response(stream):
    """Parses LangGraph/LangChain stream to extract tool calls and final text response."""
    tool_called_name = "None"
    final_response = None
    for s in stream:
        tool_data = s.get("tools")
        if tool_data:
            tool_messages = tool_data.get("messages")
            if tool_messages and isinstance(tool_messages, list):
                for msg in tool_messages:
                    tool_called_name = getattr(msg, "name", tool_called_name)
        agent_data = s.get("agent")
        if agent_data:
            messages = agent_data.get("messages")
            if messages and isinstance(messages, list):
                for msg in messages:
                    if msg.content:
                        final_response = msg.content
    return tool_called_name, final_response
