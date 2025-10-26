import React, { useState, useRef, useEffect } from 'react';
import {
  FaCommentMedical, FaMicrophone, FaCamera, FaStop,
  FaUserDoctor, FaPhone, FaBuilding, FaArrowRight,
  FaTriangleExclamation 
} from 'react-icons/fa6';

// --- MODIFIED: Import new hooks ---
import { 
  useAccount, 
  useSendTransaction, 
  useWaitForTransactionReceipt, 
  useChainId,
  useSwitchChain 
} from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { parseEther } from 'viem'; 
import { useAuth } from '../context/AuthContext'; 

const CHAT_URL = "http://localhost:8000/chat";
const TRANSCRIBE_URL = "http://localhost:8000/transcribe";

const CLINIC_WALLET_ADDRESS = "0x6A10AC054144b5ef06cA744E0Be7646C90939A43";
const CONSULTATION_FEE = "0.01"; 

function DoctorTab() {
  const [responseText, setResponseText] = useState('Your results will appear here.');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [notification, setNotification] = useState('');

  const [imageFileName, setImageFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const [recommendations, setRecommendations] = useState([]);

  const formRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // (No changes to handleRecord)
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
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], "recording.wav", { type: "audio/wav" });
            const formData = new FormData();
            formData.append('audio_file', audioFile);
            setMessage('Transcribing...');
            try {
              const response = await fetch(TRANSCRIBE_URL, { method: 'POST', body: formData });
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
  
  // (Using your regex version of handleFormSubmit)
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setResponseText('Processing...');
    setAudioUrl('');
    setRecommendations([]); 
    setNotification('');

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

      if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
      } 
      else {
        const regex = /-\s*Dr\.\s*([A-Za-z\s]+)\n\s*Specialty:\s*([A-Za-z\s]+)\n\s*Location:\s*([A-Za-z\s,]+)\n\s*Contact:\s*(\d{10})/g;
        const matches = [...data.response_text.matchAll(regex)];

        if (matches.length > 0) {
          const extractedDocs = matches.map(m => ({
            name: `Dr. ${m[1].trim()}`,
            specialty: m[2].trim(),
            location: m[3].trim(),
            contact: m[4].trim(),
          }));
          setRecommendations(extractedDocs);
        } else {
          setRecommendations([]);
        }
      }

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
  
  // (No changes to handleFileChange or useEffect)
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

  // (No changes to renderRecommendations)
  const renderRecommendations = () => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="recommendations-container-premium">
        <h4>Doctor Recommendations</h4>
        <p className="premium-subtitle">
          Book your consultation instantly using Celo.
        </p>
        <ul className="doctor-recommendations-list">
          {recommendations.map((doc, index) => (
            <li key={doc.name || index} className="doctor-card">
              <div className="doctor-card-header">
                <FaUserDoctor /> {doc.name}
              </div>
              <div className="doctor-specialty">{doc.specialty}</div>
              <div className="doctor-card-details">
                <span><FaBuilding /> {doc.location}</span>
                <span><FaPhone /> {doc.contact}</span>
              </div>
              
              <BookNowButton 
                doctor={doc} 
                setNotification={setNotification} 
              />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="tab-content doctor-layout">
      {/* (No changes to the return JSX) */}
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

        <button type="submit" onClick={() => formRef.current.requestSubmit()} disabled={isLoading || (!message && !imageFileName)} className="submit-button-large">
          {isLoading ? 'Consulting...' : 'Consult AI Doctor'}
        </button>
        
        {notification && <p className="notification-error" style={{textAlign: 'left', padding: '0 1em'}}>{notification}</p>}

        <div className="response-container">
            <h3>AI's Analysis</h3>
            {isLoading && <div className="response-text">Processing...</div>}
            {!isLoading && (
              <>
                <div className="response-text" style={{ whiteSpace: 'pre-wrap' }}>{responseText}</div>
                {audioUrl && <audio key={audioUrl} controls autoPlay src={audioUrl} />}
              </>
            )}
        </div>

        {!isLoading && renderRecommendations()}

      </div>

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

// --- MODIFIED: BookNowButton Component ---
function BookNowButton({ doctor, setNotification }) {
  const { currentUser } = useAuth(); 
  const { isConnected } = useAccount(); 
  const [bookingStatus, setBookingStatus] = useState('idle'); 
  
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // --- MODIFIED: We now get `sendTransactionAsync` ---
  const { 
    data: txHash, 
    isPending: isTxPending, 
    sendTransactionAsync // <-- Changed from sendTransaction
  } = useSendTransaction();

  const handleBackendBooking = async (hash) => {
    setBookingStatus('verifying');
    setNotification('Payment sent. Verifying booking with server...');
    try {
      const response = await fetch("http://localhost:8000/book_appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_hash: hash,
          doctor_id: doctor.name, 
          user_id: currentUser ? currentUser.uid : "unknown_user",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Booking verification failed.");
      }
      
      setBookingStatus('confirmed');
      setNotification(`Booking confirmed for ${doctor.name}!`);

    } catch (err) {
      setBookingStatus('error');
      setNotification(`Error: ${err.message}`);
    }
  };

  const { isLoading: isReceiptLoading } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess(data) {
      console.log('Transaction success! Receipt:', data);
      handleBackendBooking(data.transactionHash);
    },
    onError(err) {
      console.error('Transaction receipt error:', err);
      setBookingStatus('error');
      setNotification(`Transaction failed: ${err.message}`);
    }
  });

  // --- MODIFIED: handleBookNow is now async and uses try/catch ---
  const handleBookNow = async () => {
    console.log('Book Now button clicked!');

    if (!isConnected) {
      console.log('Wallet not connected.');
      setNotification("Please connect your Celo wallet first.");
      return;
    }
    
    if (chainId !== celoAlfajores.id) {
      console.log(`Wrong network. Current: ${chainId}, Required: ${celoAlfajores.id}`);
      setNotification("Wrong network. Please switch to Celo Alfajores.");
      switchChain({ chainId: celoAlfajores.id });
      return; 
    }

    console.log('Wallet is connected and on the correct network. Sending transaction...');
    setNotification('');
    setBookingStatus('sending');

    try {
      // --- MODIFIED: Using await and sendTransactionAsync ---
      const hash = await sendTransactionAsync({
        to: CLINIC_WALLET_ADDRESS,
        value: parseEther(CONSULTATION_FEE), 
      });
      console.log('Transaction sent! Hash:', hash);
    } catch (error) {
      // --- This will now catch the error ---
      console.error('Error sending transaction:', error);
      setNotification(`Error: ${error.message}`);
      setBookingStatus('error');
    }
  };

  const isLoading = isTxPending || isReceiptLoading || bookingStatus === 'verifying';
  
  const getButtonText = () => {
    if (bookingStatus === 'confirmed') return "Booked!";
    if (isLoading) return "Processing...";
    return <>Book Now <FaArrowRight /></>;
  };

  return (
    <button 
      className="book-now-button"
      onClick={handleBookNow}
      disabled={isLoading || bookingStatus === 'confirmed'}
    >
      {getButtonText()}
    </button>
  );
}

export default DoctorTab;