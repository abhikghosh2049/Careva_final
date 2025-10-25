import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaPaperPlane, FaStop } from 'react-icons/fa6';

const CHAT_URL = "http://localhost:8000/chat";
const TRANSCRIBE_URL = "http://localhost:8000/transcribe";

function TherapistTab() {
  const [messages, setMessages] = useState([
    { text: "Hello! What's on your mind today?", sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [notification, setNotification] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

   const handleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setNotification('');
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          audioChunksRef.current = [];
          
          mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
          
          mediaRecorderRef.current.onstop = async () => {
            // --- MODIFICATION: Changed to WAV ---
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], "recording.wav", { type: "audio/wav" });
            // --- END MODIFICATION ---

            const formData = new FormData();
            formData.append('audio_file', audioFile);

            const originalText = inputText;
            setInputText(prev => `${prev} Transcribing...`);
            try {
              const response = await fetch(TRANSCRIBE_URL, { method: 'POST', body: formData });
              if (!response.ok) throw new Error('Transcription failed.');
              const data = await response.json();
              setInputText(prev => `${originalText} ${data.transcription}`);
            } catch (error) {
              setInputText(originalText);
              setNotification(error.message);
              setTimeout(() => setNotification(''), 5000);
            }
            stream.getTracks().forEach(track => track.stop());
          };
          
          mediaRecorderRef.current.start();
          setIsRecording(true);
        })
        .catch(err => {
          console.error("Error accessing microphone:", err);
          setNotification("Could not access microphone. Please check permissions.");
          setTimeout(() => setNotification(''), 5000);
        });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!inputText) return;
    setIsLoading(true);
    setAudioUrl(''); 
    
    const userMessage = { text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    const formData = new FormData();
    formData.append('agent_type', 'therapist');
    formData.append('message', inputText);
    setInputText('');

    try {
      const response = await fetch(CHAT_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const botMessage = { text: data.response_text, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);

      if (data.response_audio_path) {
        const uniqueAudioSrc = `http://localhost:8000/${data.response_audio_path}?t=${new Date().getTime()}`;
        setAudioUrl(uniqueAudioSrc);
      }
    } catch (error) {
      const errorMessage = { text: `Error: ${error.message}`, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-content therapist-tab">
      <h3>Mental Health Support</h3>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}-message`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="therapist-form">
        <div className="input-area">
          <div className="textarea-container">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or record a message..."
              disabled={isLoading}
            />
            <button type="button" onClick={handleRecord} className={`record-button ${isRecording ? 'recording' : ''}`} disabled={isLoading}>
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </button>
          </div>
          <button type="submit" className="icon-button" disabled={isLoading || !inputText}>
            <FaPaperPlane />
          </button>
        </div>
        {notification && <p className="notification-error">{notification}</p>}
      </form>
      <div className="response-area">
        <h3>Last Response Audio</h3>
        {audioUrl && <audio key={audioUrl} controls autoPlay src={audioUrl} />}
      </div>
    </div>
  );
}

export default TherapistTab;