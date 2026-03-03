import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import SimulationPanel from './SimulationPanel';
import './App.css'; 

function App() {
  const [activeSimulation, setActiveSimulation] = useState(null);

  return (
    <div className="app-container">
      <div className="left-pane">
        <ChatPanel onSimulationTriggered={setActiveSimulation} />
      </div>
      <div className="right-pane">
        <SimulationPanel activeSimulation={activeSimulation} />
      </div>
    </div>
  );
}

export default App;