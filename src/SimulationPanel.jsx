import React, { useEffect, useRef } from 'react';
import { initSolarSystem } from './solar';
import { initDnaHelix } from './dna';

function SimulationPanel({ activeSimulation }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!activeSimulation || !containerRef.current) return;

    let cleanupFunction;

    // Load the correct simulation based on state
    if (activeSimulation === 'solar') {
      cleanupFunction = initSolarSystem(containerRef.current);
    } else if (activeSimulation === 'dna') {
      cleanupFunction = initDnaHelix(containerRef.current);
    }

    // Cleanup when the component unmounts or activeSimulation changes
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [activeSimulation]);

  return (
    <div className="simulation-panel">
      {!activeSimulation && <div className="placeholder">Awaiting prompt...</div>}
      {/* This div is where Three.js will inject the <canvas> */}
      <div ref={containerRef} className="canvas-container"></div>
    </div>
  );
}

export default SimulationPanel;