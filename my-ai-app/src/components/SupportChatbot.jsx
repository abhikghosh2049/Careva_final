import React, { useState, useEffect, useRef } from 'react';
// Import FaTimes for the close button
import { FaPaperPlane, FaRobot, FaUser, FaXmark } from 'react-icons/fa6';
// --- Knowledge Base (No changes needed here) ---
const knowledgeBase = {
  sections: [
    {
      topic: 'AI Doctor',
      keywords: ['doctor', 'physical', 'health', 'medical', 'symptom', 'diagnosis', 'image', 'voice', 'stt', 'tts'],
      content: `The AI Doctor provides fast, text-based general medical information and preliminary diagnostics. It's designed for non-emergency, general medical advice and symptom checking - not a substitute for human doctors or emergency care.<br><br><strong>Input Methods:</strong><br>• <strong>Text</strong>: Type symptoms or health questions directly<br>• <strong>Voice</strong>: Use the microphone icon for Groq Whisper speech-to-text<br>• <strong>Image</strong>: Upload photos for visible issues (skin conditions, rashes) for multimodal analysis<br><br><strong>Output</strong>: Text responses with gTTS text-to-speech audio for convenience.<br><br><strong>Important</strong>: This is NOT a substitute for professional medical care. In emergencies, contact local emergency services immediately.`
    },
    {
      topic: 'AI Therapist',
      keywords: ['therapist', 'mental', 'emotional', 'therapy', 'counseling', 'stress', 'anxiety', 'depression', 'crisis', 'feelings'],
      content: `The AI Therapist offers empathetic, confidential support for mental and emotional well-being.<br><br><strong>Features:</strong><br>• Guidance and coping strategies<br>• Mindfulness exercises<br>• Non-judgmental space for emotional processing<br>• Strict confidentiality for all conversations<br><br><strong>Crisis Safety</strong>: Includes critical safety tools using Twilio services. If severe mental health crisis is detected, immediate crisis resources and emergency protocols will be initiated.<br><br><strong>Important</strong>: This is NOT a substitute for human therapy or crisis intervention. In emergencies, contact local emergency services immediately.`
    },
    {
       topic: 'Celo Payments',
       keywords: ['payment', 'pay', 'transaction', 'celo', 'wallet', 'crypto', 'book', 'booking', 'fee', 'charge', 'billing', 'usd', 'stablecoin'],
       content: `Careva uses the Celo blockchain for secure and efficient appointment booking.<br><br><strong>Booking Process:</strong><br>• After consulting the AI Doctor, recommended specialists are shown.<br>• Click "Book Now" to initiate a payment.<br>• You will be prompted to connect your Celo-compatible wallet (like Valora or MetaMask).<br>• Confirm the transaction (currently a small test fee in A-CELO on the Alfajores testnet) in your wallet.<br>• Once confirmed on the blockchain, the booking is verified by our system.<br><br><strong>Security</strong>: Blockchain transactions provide a transparent and secure record of your booking payment.`
    },
    {
      topic: 'Referral Rewards',
      keywords: ['referral', 'refer', 'reward', 'code', 'share', 'friend', 'credit', 'discount', 'bonus'],
      content: `Earn rewards by sharing Careva with friends, family, and colleagues!<br><br><strong>How It Works:</strong><br>1. Find your unique Referral Code in the 'Referrals' section (coming soon!)<br>2. Share the code with others<br>3. When someone signs up with your code AND completes their first qualifying action (e.g., premium subscription), you BOTH receive rewards<br><br><strong>Rewards Include:</strong><br>• Credits for premium features<br>• Discounts on future subscriptions<br><br>Check the 'Referrals' section for current reward details.`
    },
    {
      topic: 'Transaction Issues',
      keywords: ['issue', 'problem', 'error', 'failed', 'wrong', 'dispute', 'refund', 'help', 'fix', 'blockchain', 'hash'],
      content: `If you encounter payment, booking, or referral reward issues:<br><br><strong>Contact Support:</strong><br>• <strong>Email</strong>: support@careva.health<br>• <strong>WhatsApp</strong>: 8975663002<br><br><strong>Required Information:</strong><br>1. <strong>Subject Line</strong>: "Transaction Issue - [Brief Description]"<br>2. <strong>Transaction ID / Hash</strong>: (If applicable, provide the Celo transaction hash or Order Number)<br>3. <strong>Proof</strong>: Screenshot of wallet transaction, bank charge, or error message<br><br>This ensures fastest resolution.`
    },
    {
      topic: 'General Support',
      keywords: ['support', 'contact', 'help', 'question', 'inquiry', 'team', 'email', 'account', 'login', 'password'],
      content: `For general questions about usage, features, account issues, or other inquiries:<br><br><strong>Contact</strong>: support@careva.health<br><br>Our human support team will investigate and follow up directly.<br><br><strong>Quick Contact:</strong><br>• Email: support@careva.health<br>• WhatsApp: 8975663002`
     }
  ]
};

// --- Add onClose prop ---
function SupportChatbot({ onClose }) { 
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm the Careva Support Assistant. How can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Logic Functions (No changes) ---
  const findRelevantContent = (query) => {
    const lowerQuery = query.toLowerCase();
    const scores = knowledgeBase.sections.map(section => {
      let score = 0;
      section.keywords.forEach(keyword => {
        if (lowerQuery.includes(keyword)) score += 2;
      });
      lowerQuery.split(' ').forEach(word => {
        if (word.length > 2 && section.topic.toLowerCase().includes(word)) score += 1;
      });
      return { section, score };
    });
    const relevantSections = scores.filter(item => item.score > 1).sort((a, b) => b.score - a.score).slice(0, 2).map(item => item.section);
    return relevantSections.length > 0 ? relevantSections : null;
  };

  const generateResponse = (query) => {
    const relevantSections = findRelevantContent(query);
    if (!relevantSections) return `I'm here to help... (rest of default message)`; // Keep default message
    return relevantSections.map(section => section.content).join('<br><br><hr style="border-top: 1px solid #e5e7eb; margin: 1rem 0;"><br>');
  };

  const handleSend = () => {
    const query = inputValue.trim();
    if (!query || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInputValue('');
    setIsLoading(true);
    setTimeout(() => {
      const responseContent = generateResponse(query);
      setMessages(prev => [...prev, { role: 'assistant', content: responseContent }]);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) handleSend();
  };

  return (
    // --- Container class is now different, for overlay positioning ---
    <div className="support-chatbot-window"> 
      {/* Header */}
      <div className="support-chatbot-header">
         <div className="support-avatar bot-avatar">
            <FaRobot size={24} color="white" />
          </div>
          <div style={{ flexGrow: 1 }}> {/* Allow title/subtitle to take space */}
            <h1>Careva Support Assistant</h1>
            <p>AI-powered help for your health platform</p>
          </div>
          {/* --- NEW Close Button --- */}
          <button onClick={onClose} className="support-close-button" title="Close Chat">
             <FaXmark size={20} />
          </button>
      </div>

      {/* Messages Area (No structure change) */}
      <div className="support-messages-container">
        {/* ... messages mapping ... */}
         <div className="support-messages-inner">
          {messages.map((msg, index) => (
            <div key={index} className={`support-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="support-avatar bot-avatar">
                  <FaRobot size={20} color="white" />
                </div>
              )}
              <div className="support-message-content" dangerouslySetInnerHTML={{ __html: msg.content }}></div>
              {msg.role === 'user' && (
                <div className="support-avatar user-avatar">
                   <FaUser size={20} color="#4b5563" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="support-message assistant">
              <div className="support-avatar bot-avatar">
                 <FaRobot size={20} color="white" />
              </div>
              <div className="support-message-content">
                <div className="support-loading-spinner"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area (No structure change) */}
      <div className="support-input-container">
         {/* ... input wrapper ... */}
         <div className="support-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about Careva's services..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
             <FaPaperPlane size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupportChatbot;