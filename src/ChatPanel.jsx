import React, { useState } from 'react';

function ChatPanel({ onSimulationTriggered }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'system', text: 'Hello! What would you like to simulate today?' }]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to UI
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);

    // Placeholder logic: Keyword matching before you hook up your AI model
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('dna')) {
      onSimulationTriggered('dna');
      setMessages([...newMessages, { role: 'system', text: 'Loading DNA Helix simulation...' }]);
    } else if (lowerInput.includes('solar')) {
      onSimulationTriggered('solar');
      setMessages([...newMessages, { role: 'system', text: 'Loading Solar System simulation...' }]);
    } else {
      setMessages([...newMessages, { role: 'system', text: 'I am not sure how to simulate that yet. Try "DNA" or "Solar System".' }]);
    }

    setInput('');
  };

  return (
    <div className="chat-panel">
      <h2>Simulation Chat</h2>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="input-form">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask to simulate something..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatPanel;