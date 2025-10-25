import uvicorn
import os
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict
import base64
from pydub import (
    AudioSegment,
)  # We keep this import just in case, but don't use it for transcription
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- Agents and Services ---
from backend.agents.mental_health import (
    mental_health_agent,
    parse_response as parse_therapist_response,
    SYSTEM_PROMPT_MENTAL_HEALTH,
)
from backend.agents.general_doctor import (
    general_doctor_agent,
    parse_response as parse_doctor_response,
    SYSTEM_PROMPT_DOCTOR as TEXT_DOCTOR_PROMPT,  # Prompt for text-only agent
)
from backend.services.stt import transcribe_with_groq
from backend.services.tts import text_to_speech_with_gtts
from backend.services.llm_clients import (
    analyze_image_with_query,
    encode_image,
    SYSTEM_PROMPT_DOCTOR as IMAGE_DOCTOR_PROMPT,  # Prompt for image analysis
)

# --- Define a dedicated directory for generated files ---
GENERATED_FILES_DIR = os.path.join(os.path.dirname(__file__), "generated_files")
os.makedirs(GENERATED_FILES_DIR, exist_ok=True)

app = FastAPI()

# --- CORS Middleware Setup ---
origins = ["http://localhost:5173"]  # Correct origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount the dedicated directory to serve files ---
app.mount(
    "/generated_files", StaticFiles(directory=GENERATED_FILES_DIR), name="generated"
)


# --- Dedicated Transcription Endpoint (MODIFIED) ---
@app.post("/transcribe")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    if not audio_file or audio_file.size == 0:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    temp_files = []
    try:
        # Save the original file (e.g., "recording.wav")
        original_filepath = os.path.join(
            GENERATED_FILES_DIR, f"transcribe_{audio_file.filename}"
        )
        with open(original_filepath, "wb") as f:
            f.write(await audio_file.read())
        temp_files.append(original_filepath)

        # --- MODIFICATION ---
        # REMOVED the pydub conversion block.
        # We will send the original audio file (wav) directly to Groq.

        # Transcribe the original file
        transcribed_text = transcribe_with_groq(original_filepath)

        return {"transcription": transcribed_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        # Clean up the temporary original file
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)


# ---------------------------------------------


@app.post("/chat")
async def chat_handler(
    agent_type: str = Form(...),
    message: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
):
    user_message = message
    response_text = "Sorry, an error occurred."
    temp_files = []
    recommendations = []
    recommendation_error = ""

    # --- THIS BLOCK IS ALSO MODIFIED ---
    if audio_file and audio_file.size > 0:
        original_filepath = os.path.join(
            GENERATED_FILES_DIR, f"temp_{audio_file.filename}"
        )
        with open(original_filepath, "wb") as f:
            f.write(await audio_file.read())
        temp_files.append(original_filepath)

        # --- MODIFICATION ---
        # REMOVED pydub conversion. Transcribe the original file directly.
        try:
            user_message = transcribe_with_groq(original_filepath)
        except Exception as e:
            # Clean up before raising
            for f in temp_files:
                if os.path.exists(f):
                    os.remove(f)
            raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
        # --- END MODIFICATION ---

    # Check if EITHER text OR a valid image is provided
    if not user_message and (not image_file or image_file.size == 0):
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)
        raise HTTPException(
            status_code=400, detail="No message, audio, or image provided."
        )

    final_query = user_message if user_message else "Please analyze the image."

    if agent_type == "therapist":
        inputs = {
            "messages": [("system", SYSTEM_PROMPT_MENTAL_HEALTH), ("user", final_query)]
        }
        stream = mental_health_agent.stream(inputs, stream_mode="updates")
        tool_called_name, response_text = parse_therapist_response(stream)

    elif agent_type == "doctor":
        # Check if a file with content was actually uploaded
        if image_file and image_file.size > 0:
            # --- IMAGE LOGIC ---
            image_filepath = os.path.join(
                GENERATED_FILES_DIR, f"temp_{image_file.filename}"
            )
            try:
                with open(image_filepath, "wb") as f:
                    f.write(await image_file.read())
                temp_files.append(image_filepath)

                encoded_image = encode_image(image_filepath)
                full_multimodal_query = IMAGE_DOCTOR_PROMPT + (
                    user_message or "Please analyze the image."
                )
                response_text = analyze_image_with_query(
                    query=full_multimodal_query, encoded_image=encoded_image
                )
                tool_called_name = "Groq Multimodal Call"
            except Exception as e:
                response_text = f"Error during multimodal processing: {e}"
                tool_called_name = "Error"
        elif user_message:
            # --- TEXT-ONLY LOGIC ---
            inputs = {
                "messages": [("system", TEXT_DOCTOR_PROMPT), ("user", final_query)]
            }
            stream = general_doctor_agent.stream(inputs, stream_mode="updates")
            tool_called_name, response_text = parse_doctor_response(stream)
            recommendations = []
            recommendation_error = ""
        else:
            raise HTTPException(
                status_code=400,
                detail="No message provided for text-only consultation.",
            )

    else:
        raise HTTPException(status_code=400, detail="Invalid agent_type")

    output_filename = "response.mp3"
    output_filepath = os.path.join(GENERATED_FILES_DIR, output_filename)
    text_to_speech_with_gtts(response_text, output_filepath)

    response_audio_path_for_frontend = f"generated_files/{output_filename}"

    for f in temp_files:
        if os.path.exists(f):
            os.remove(f)

    return {
        "response_text": response_text,
        "response_audio_path": response_audio_path_for_frontend,
        "tool_called": tool_called_name if "tool_called_name" in locals() else "None",
        "recommendations": recommendations,
        "recommendation_error": recommendation_error,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
