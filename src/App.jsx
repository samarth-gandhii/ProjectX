import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import SimulationPanel from './SimulationPanel';
import './App.css'; 

function App() {
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // This forces Three.js to resize the canvas smoothly when the panel opens/closes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300); // 300ms matches our CSS transition speed

    return () => clearTimeout(timeoutId);
  }, [isChatOpen]);

  return (
    <div className="app-container">
      <div className={`left-pane ${isChatOpen ? '' : 'collapsed'}`}>
        <ChatPanel onSimulationTriggered={setActiveSimulation} />
      </div>
      
      <div className="right-pane">
        {/* Floating Toggle Button */}
        <button 
          className="toggle-chat-btn" 
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          {isChatOpen ? '◀ Collapse' : '▶ Chat'}
        </button>
        
        <SimulationPanel activeSimulation={activeSimulation} />
      </div>
    </div>
  );
}

export default App;