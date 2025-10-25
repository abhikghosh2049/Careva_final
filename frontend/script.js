const BACKEND_URL = "http://localhost:8000/chat";

// --- Tab switching logic ---
function openTab(event, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";

    // For the doctor tab, set display to grid
    if (tabName === 'doctor') {
        document.getElementById(tabName).style.display = "grid";
    }
}

// --- Handle Doctor Form Submission ---
const doctorForm = document.getElementById('doctor-form');
doctorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = doctorForm.querySelector('button[type="submit"]');
    const formData = new FormData(doctorForm);
    const responseTextDiv = document.getElementById('doctor-response-text');
    const responseAudio = document.getElementById('doctor-response-audio');

    // --- Debugging: Log form data before sending ---
    console.log("Submitting to Doctor with the following data:");
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
    // ------------------------------------------------

    responseTextDiv.textContent = 'Processing...';
    responseAudio.src = '';
    submitButton.disabled = true; // Disable button

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        responseTextDiv.textContent = data.response_text;

        if (data.response_audio_path) {
            // Fetch the audio file from the backend
            const audioResponse = await fetch(`http://localhost:8000/${data.response_audio_path}`);
            const audioBlob = await audioResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            responseAudio.src = audioUrl;
            responseAudio.play();
        }

    } catch (error) {
        responseTextDiv.textContent = `Error: ${error.message}`;
        console.error('There was a problem with the fetch operation:', error);
    } finally {
        submitButton.disabled = false; // Re-enable button
    }
});

// --- Handle Therapist Form Submission ---
const therapistForm = document.getElementById('therapist-form');
const chatWindow = document.getElementById('therapist-chat-window');

therapistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = therapistForm.querySelector('button[type="submit"]');
    const formData = new FormData(therapistForm);
    const userMessage = formData.get('message');
    const responseAudio = document.getElementById('therapist-response-audio');

    // --- Debugging: Log form data before sending ---
    console.log("Submitting to Therapist with the following data:");
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
    // ------------------------------------------------
    
    // Display user message in chat
    if (userMessage || formData.get('audio_file').size > 0) {
        appendMessage(userMessage || "Sent audio message...", 'user');
    }

    submitButton.disabled = true; // Disable button

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // Display bot response in chat
        appendMessage(data.response_text, 'bot');
        
        // Handle audio response
        if (data.response_audio_path) {
             const audioResponse = await fetch(`http://localhost:8000/${data.response_audio_path}`);
             const audioBlob = await audioResponse.blob();
             const audioUrl = URL.createObjectURL(audioBlob);
             responseAudio.src = audioUrl;
             responseAudio.play();
        }
        
        // Clear the input fields
        document.getElementById('therapist-text').value = '';
        document.getElementById('therapist-audio').value = '';

    } catch (error) {
        appendMessage(`Error: ${error.message}`, 'bot');
        console.error('There was a problem with the fetch operation:', error);
    } finally {
        submitButton.disabled = false; // Re-enable button
    }
});

// --- Helper function to add messages to the chat window ---
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', `${sender}-message`);
    const p = document.createElement('p');
    p.textContent = text;
    messageDiv.appendChild(p);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to latest message
}