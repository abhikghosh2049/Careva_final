import gradio as gr
import requests
import os

BACKEND_URL = "http://localhost:8000/chat"

# Global chat history state for conversational continuity
therapist_chat_history = []


def process_inputs(
    audio_filepath, image_filepath, text_input, agent_type, chat_history
):
    """
    Handles the communication with the FastAPI backend.
    """
    payload = {
        "agent_type": agent_type,
        "message": (
            text_input if text_input else ""
        ),  # Ensure message is never None if we have files
    }
    files = {}

    # 1. Prepare audio file for upload if present
    if audio_filepath:
        if os.path.exists(audio_filepath):
            files["audio_file"] = open(audio_filepath, "rb")
        else:
            return (
                chat_history,
                text_input,
                "Error: Audio file not found. Try recording again.",
                None,
            )

    # 2. Prepare image file for upload if present (Doctor tab only)
    if image_filepath and agent_type == "doctor":
        if os.path.exists(image_filepath):
            files["image_file"] = open(image_filepath, "rb")
        else:
            return chat_history, text_input, "Error: Image file not found.", None

    # Validation Check: At least one form of input required
    if not (text_input or audio_filepath or image_filepath):
        return chat_history, text_input, "Please provide text or voice input.", None

    # Append user message to history before sending
    chat_history.append((text_input, None))

    try:
        # Send the request to the backend
        response = requests.post(BACKEND_URL, data=payload, files=files)
        response.raise_for_status()
        data = response.json()

        response_text = data.get("response_text", "No response from backend.")
        response_audio_path = data.get("response_audio_path")

        # Update the last entry (the user message) with the assistant's response
        chat_history[-1] = (text_input, response_text)

        # Reset the input field after successful processing
        new_text_input = ""

        # Return updated history and outputs
        return chat_history, new_text_input, response_text, response_audio_path

    except requests.exceptions.RequestException as e:
        # If API call fails, remove the last (failed) user entry from chat history
        chat_history.pop()
        error_message = f"Error communicating with backend: {e}"
        return chat_history, text_input, error_message, None

    finally:
        # Ensure files are closed after sending
        for f in files.values():
            f.close()


# --- UI LAYOUT ---

with gr.Blocks(title="Unified AI Healthcare") as iface:
    gr.Markdown("# Unified AI Doctor and Therapist")

    # Define a hidden placeholder for the image input used in the therapist tab
    image_input_placeholder = gr.Textbox(value=None, visible=False)

    with gr.Tabs():
        # --- TAB 1: AI Doctor (General Health + Multimodal) ---
        with gr.TabItem("AI Doctor (General & Vision)"):
            gr.Markdown(
                "### Consult your AI Doctor for general health questions or image analysis."
            )

            # Hidden field to specify the agent type for the backend
            agent_type_doctor = gr.Textbox(value="doctor", visible=False)

            with gr.Row():
                text_input_doctor = gr.Textbox(
                    label="Text Input (e.g., Describe symptoms)"
                )
                audio_input_doctor = gr.Audio(
                    sources=["microphone"], type="filepath", label="Voice Input"
                )

            image_input_doctor = gr.Image(
                type="filepath",
                label="Image Input (Upload a photo for analysis, e.g., skin condition)",
            )

            submit_button_doctor = gr.Button("Submit to Doctor")

            gr.Markdown("### Doctor's Responses")
            with gr.Row():
                # --- EDITED: Increased size of Textbox for Doctor ---
                text_output_doctor = gr.Textbox(label="Text Response", lines=10)
                audio_output_doctor = gr.Audio(label="Audio Response")

            submit_button_doctor.click(
                fn=process_inputs,
                inputs=[
                    audio_input_doctor,
                    image_input_doctor,
                    text_input_doctor,
                    agent_type_doctor,
                    gr.State([]),
                ],  # Passing empty state for history
                outputs=[text_output_doctor, audio_output_doctor],
            )

        # --- TAB 2: AI Therapist (Mental Health, Chat Flow) ---
        with gr.TabItem("AI Therapist (Mental Health)"):
            gr.Markdown(
                "### Talk to your AI Therapist for emotional support and guidance."
            )

            # Hidden field to specify the agent type for the backend
            agent_type_therapist = gr.Textbox(value="therapist", visible=False)

            # State to maintain chat history across turns
            chatbot_state = gr.State([])

            # Dedicated Chatbot UI element
            chatbot = gr.Chatbot(label="Therapist Chat", height=400)

            with gr.Row():
                text_input_therapist = gr.Textbox(
                    label="Text Input (What's on your mind today?)", scale=3
                )
                audio_input_therapist = gr.Audio(
                    sources=["microphone"],
                    type="filepath",
                    label="Voice Input",
                    scale=1,
                )

            submit_button_therapist = gr.Button("Submit to Therapist")

            gr.Markdown("### Current Response")
            with gr.Row():
                text_output_therapist = gr.Textbox(
                    label="Last Text Response", lines=5, interactive=False
                )
                audio_output_therapist = gr.Audio(label="Audio Response")

            # --- Therapist Submission Logic (Multi-Turn) ---
            submit_button_therapist.click(
                fn=process_inputs,
                # CRITICAL FIX: The process_inputs function now accepts and returns chat_history
                inputs=[
                    audio_input_therapist,
                    image_input_placeholder,
                    text_input_therapist,
                    agent_type_therapist,
                    chatbot_state,
                ],
                outputs=[
                    chatbot,
                    text_input_therapist,
                    text_output_therapist,
                    audio_output_therapist,
                ],
            )


if __name__ == "__main__":
    iface.launch(debug=True)
# uv run frontend/app.py
