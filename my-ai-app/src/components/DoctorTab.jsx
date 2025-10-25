import React, { useState, useRef, useEffect } from 'react';
import {
  FaCommentMedical,
  FaMicrophone,
  FaCamera,
  FaStop,
  FaUserDoctor,
  FaPhone,
  FaBuilding,
  FaArrowRight,
  FaTriangleExclamation 
} from 'react-icons/fa6';

const CHAT_URL = "http://localhost:8000/chat";
const TRANSCRIBE_URL = "http://localhost:8000/transcribe";

function DoctorTab() {
  const [responseText, setResponseText] = useState('Your results will appear here.');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [notification, setNotification] = useState('');

  const [imageFileName, setImageFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const formRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
          
          mediaRecorderRef.current.ondataavailable = event => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorderRef.current.onstop = async () => {
            // --- MODIFICATION: Changed to WAV ---
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], "recording.wav", { type: "audio/wav" });
            // --- END MODIFICATION ---

            const formData = new FormData();
            formData.append('audio_file', audioFile);

            setMessage('Transcribing...');
            try {
              const response = await fetch(TRANSCRIBE_URL, {
                method: 'POST',
                body: formData
              });
              if (!response.ok) throw new Error('Transcription failed.');
              const data = await response.json();
              setMessage(data.transcription);
            } catch (error) {
              setMessage('');
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

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setResponseText('Processing...');
    setAudioUrl('');

    const formData = new FormData(formRef.current); 
    formData.set('message', message);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        body: formData,
  });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      setResponseText(data.response_text); 

      if (data.response_audio_path) {
        const uniqueAudioSrc = `http://localhost:8000/${data.response_audio_path}?t=${new Date().getTime()}`;
        setAudioUrl(uniqueAudioSrc);
      }
    } catch (error) {
      setResponseText(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFileName(file.name);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    } else {
      setImageFileName('');
      setImagePreviewUrl('');
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  return (
    <div className="tab-content doctor-layout">
      {/* --- Left Column: Conversation --- */}
      <div className="conversation-column">
        
        <form ref={formRef} onSubmit={handleFormSubmit} className="form-container">
          <h3>Patient Input</h3>
          <input type="hidden" name="agent_type" value="doctor" />
          <div className="input-group">
            <label htmlFor="doctor-text"><FaCommentMedical /> Describe your symptoms</label>
            <div className="textarea-container">
              <textarea 
                id="doctor-text" 
                name="message" 
                rows="5" 
                placeholder="Type or record your symptoms..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="button" onClick={handleRecord} className={`record-button ${isRecording ? 'recording' : ''}`}>
                {isRecording ? <FaStop /> : <FaMicrophone />}
              </button>
            </div>
          </div>
           <input 
              type="file" 
              id="doctor-image" 
              name="image_file" 
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }} 
            />
        </form>

        <button type="submit" onClick={() => formRef.current.requestSubmit()} disabled={isLoading || !message} className="submit-button-large">
          {isLoading ? 'Consulting...' : 'Consult AI Doctor'}
        </button>
        
        {/* --- Block 1: AI's General Analysis --- */}
        {(isLoading || (responseText && responseText !== 'Your results will appear here.')) && (
          <div className="response-container">
            <h3>AI's Analysis</h3>
            {isLoading && <div className="response-text">Processing...</div>}
            {!isLoading && (
              <>
                <div className="response-text" style={{ whiteSpace: 'pre-wrap' }}>{responseText}</div>
                {notification && <p className="notification-error">{notification}</p>}
                {audioUrl && <audio key={audioUrl} controls autoPlay src={audioUrl} />}
              </>
            )}
          </div>
        )}
      </div>

      {/* --- Right Column: Image --- */}
      <div className="image-column">
        <h3>Image Upload (Optional)</h3>
        <div className="file-input-container">
          <label htmlFor="doctor-image" className="file-input-label">
            <FaCamera />
            <span>{imageFileName || 'Click to upload an image'}</span>
          </label>
        </div>
        <div className="image-preview-container">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Selected preview" className="image-preview" />
          ) : (
            <div className="image-preview-placeholder">
              <FaCamera />
              <p>Image preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorTab;