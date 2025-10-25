import os
import elevenlabs
from elevenlabs.client import ElevenLabs
from gtts import gTTS
import platform
import subprocess

from backend.config import ELEVENLABS_API_KEY


def text_to_speech_with_elevenlabs(input_text: str, output_filepath: str) -> str:
    """
    Converts text to speech and saves it as an MP3 file using ElevenLabs.
    """
    if not ELEVENLABS_API_KEY:
        print("ElevenLabs API key not configured. Using gTTS instead.")
        return text_to_speech_with_gtts(input_text, output_filepath)

    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    try:
        audio = client.generate(
            text=input_text,
            voice="Aria",
            output_format="mp3_22050_32",
            model="eleven_turbo_v2",
        )
        elevenlabs.save(audio, output_filepath)
        return output_filepath
    except Exception as e:
        print(f"ElevenLabs error: {e}. Falling back to gTTS.")
        return text_to_speech_with_gtts(input_text, output_filepath)


def text_to_speech_with_gtts(input_text: str, output_filepath: str) -> str:
    """
    Converts text to speech and saves it as an MP3 file using gTTS.
    """
    try:
        audio_obj = gTTS(text=input_text, lang="en", slow=False)
        audio_obj.save(output_filepath)
        return output_filepath
    except Exception as e:
        print(f"gTTS error: {e}. Cannot generate audio.")
        return None


# Combined function to play audio on various operating systems
def play_audio_file(filepath: str):
    """
    Plays an MP3 file using the appropriate system command.
    """
    if not filepath or not os.path.exists(filepath):
        print("No audio file to play.")
        return

    os_name = platform.system()
    try:
        if os_name == "Darwin":
            subprocess.run(["afplay", filepath])
        elif os_name == "Windows":
            subprocess.run(
                [
                    "powershell",
                    "-c",
                    f'(New-Object Media.SoundPlayer "{filepath}").PlaySync();',
                ]
            )
        elif os_name == "Linux":
            subprocess.run(["aplay", filepath])
        else:
            print("Unsupported OS for audio playback.")
    except Exception as e:
        print(f"Error playing audio: {e}")
