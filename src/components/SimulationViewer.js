import React, { useEffect, useState } from 'react';
import './App.css';

const App = () => {
    const [simulationData, setSimulationData] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        // Fetch the simulation data from the Django backend
        fetch('http://localhost:8000/api/run-simulation/')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Simulation Data:', data);
                setSimulationData(data.simulation_data);
                setCurrentFrame(0);
            })
            .catch(error => {
                console.error('Error fetching simulation data:', error);
            });
    }, []);

    useEffect(() => {
        if (simulationData.length > 0) {
            const interval = setInterval(() => {
                setCurrentFrame(prevFrame => (prevFrame + 1) % simulationData.length);
            }, 1000); // Change every second
            return () => clearInterval(interval);
        }
    }, [simulationData]);

    if (simulationData.length === 0) {
        return <div>Loading...</div>;
    }

    const frameData = simulationData[currentFrame];
    const scale = 40; // scale factor to visualize the positions

    return (
        <div className="App">
            <h1>Air Defense Simulation</h1>
            <h3>Iteration {frameData.iteration}, Time Step {frameData.time_step + 1}</h3>
            <svg width={400} height={400} style={{ border: '1px solid black' }}>
                {frameData.towers.map((tower, index) => (
                    <circle
                        key={`tower-${index}`}
                        cx={tower[1] * scale}
                        cy={tower[0] * scale}
                        r={frameData.T * scale}
                        fill="blue"
                        opacity="0.3"
                    />
                ))}
                {frameData.targets.map((target, index) => (
                    <rect
                        key={`target-${index}`}
                        x={target[1] * scale - 5}
                        y={target[0] * scale - 5}
                        width={10}
                        height={10}
                        fill="red"
                    />
                ))}
                {frameData.rockets.map((rocket, index) => (
                    <line
                        key={`rocket-${index}`}
                        x1={rocket.start[1] * scale}
                        y1={rocket.start[0] * scale}
                        x2={rocket.position[1] * scale}
                        y2={rocket.position[0] * scale}
                        stroke={rocket.intercepted ? "green" : "black"}
                        strokeWidth="2"
                    />
                ))}
            </svg>
        </div>
    );
};

export default App;
