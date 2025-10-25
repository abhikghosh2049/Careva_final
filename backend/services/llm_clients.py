import os
import base64
from groq import Groq
from backend.config import GROQ_API_KEY, LLM_MODEL_DOCTOR

# System prompt for the AI Doctor agent
SYSTEM_PROMPT_DOCTOR = """
You have to act as a professional doctor, i know you are not but this is for learning purpose. 
What's in this image?. Do you find anything wrong with it medically? 
If you make a differential, suggest some remedies for them. Donot add any numbers or special characters in 
your response. Your response should be in one long paragraph. Also always answer as if you are answering to a real person.
Donot say 'In the image I see' but say 'With what I see, I think you have ....'
Dont respond as an AI model in markdown, your answer should mimic that of an actual doctor not an AI bot, 
Keep your answer concise (max 2 sentences). No preamble, start your answer right away please
"""


def analyze_image_with_query(
    query: str,
    encoded_image: str,
    model: str = LLM_MODEL_DOCTOR,
    **kwargs,  # Capture unexpected arguments
) -> str:
    """
    Analyzes an image with a text query using a multimodal LLM.
    """
    # CRITICAL FIX: Remove max_retries if it was passed by LangChain's agent executor
    if "max_retries" in kwargs:
        del kwargs["max_retries"]

    client = Groq(api_key=GROQ_API_KEY)

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": query},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
                },
            ],
        }
    ]

    try:
        # Pass remaining kwargs to the create method
        chat_completion = client.chat.completions.create(
            messages=messages, model=model, **kwargs
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        # Provide a specific error message if the API call fails
        return f"Error processing image: {e}"


def encode_image(image_file: str) -> str:
    """
    Encodes an image file to a base64 string.
    """
    with open(image_file, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")
