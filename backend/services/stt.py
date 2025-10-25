import os
import speech_recognition as sr
from pydub import AudioSegment
from io import BytesIO
from groq import Groq
from backend.config import GROQ_API_KEY


def transcribe_with_groq(audio_filepath: str) -> str:
    """
    Transcribes an audio file to text using the Groq Whisper model.
    """
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY not configured."

    client = Groq(api_key=GROQ_API_KEY)
    try:
        with open(audio_filepath, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3", file=audio_file, language="en"
            )
        return transcription.text
    except Exception as e:
        return f"Transcription error: {e}"
