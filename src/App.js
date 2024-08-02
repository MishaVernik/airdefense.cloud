import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const App = () => {
    const [simulationData, setSimulationData] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [speed, setSpeed] = useState(100); // Default speed is 1000ms per frame
    const svgRef = useRef(null);
    const previousPositions = useRef({}); // To keep track of rocket positions

    // Rightward offset
    const offsetX = 100; // Adjust this value to shift all elements to the right

    useEffect(() => {
        // Fetch the simulation data from the Django backend
        fetch('http://localhost:8000/api/run-simulation/')
        // fetch('https://airdefense-backend-ghexf2eagme5gfg5.eastus-01.azurewebsites.net/api/run-simulation/')
            .then(response => response.json())
            .then(data => {
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
            }, speed); // Interval controlled by speed state
            return () => clearInterval(interval);
        }
    }, [simulationData, speed]);

    useEffect(() => {
        if (svgRef.current && simulationData.length > 0) {
            const frameData = simulationData[currentFrame];
            const scale = 50; // Adjusted scale factor
            const svg = svgRef.current;

            // Clear previous frame's content
            svg.innerHTML = '';

            // Draw static elements
            drawStaticElements(svg, frameData, scale);

            // Draw dynamic elements (rocket trajectories)
            drawDynamicElements(svg, frameData, scale);
        }
    }, [currentFrame]);

    const drawStaticElements = (svg, frameData, scale) => {
        // Draw grid with coordinates
        for (let i = 0; i <= frameData.N; i++) {
            svg.appendChild(createLine(offsetX, i * scale, offsetX + frameData.M * scale, i * scale, 'lightgray'));
            svg.appendChild(createLine(i * scale + offsetX, 0, i * scale + offsetX, frameData.N * scale, 'lightgray'));
            svg.appendChild(createText(-20 + offsetX, i * scale + 5, `${i}`, 'black')); // Y-axis labels
            svg.appendChild(createText(i * scale + offsetX - 10, frameData.N * scale + 20, `${i}`, 'black')); // X-axis labels
        }

        // Draw towers as small squares with radii
        frameData.towers.forEach(tower => {
            svg.appendChild(createCircle(tower[1] * scale + offsetX, tower[0] * scale, 3 * scale, 'blue', 0.1)); // Radius circle
            svg.appendChild(createRect(tower[1] * scale + offsetX - 5, tower[0] * scale - 5, 10, 10, 'blue')); // Tower
        });

        // Draw targets as houses
        frameData.targets.forEach(target => {
            svg.appendChild(createHouse(target[1] * scale + offsetX, target[0] * scale));
        });
    };

    const drawDynamicElements = (svg, frameData, scale) => {
        // Draw rocket trajectories and positions
        frameData.rockets.forEach((rocket, rocketIdx) => {
            // Retrieve the previous position from the ref
            const previousPosition = previousPositions.current[rocketIdx];

            if (previousPosition) {
                const rocketPath = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                rocketPath.setAttribute('x1', previousPosition[1] * scale + offsetX);
                rocketPath.setAttribute('y1', previousPosition[0] * scale);
                rocketPath.setAttribute('x2', rocket.position[1] * scale + offsetX);
                rocketPath.setAttribute('y2', rocket.position[0] * scale);
                rocketPath.setAttribute('stroke', rocket.intercepted ? 'green' : `hsl(${rocketIdx * 60}, 100%, 50%)`);
                rocketPath.setAttribute('stroke-width', '2');
                svg.appendChild(rocketPath);
            }

            const rocketCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            rocketCircle.setAttribute('cx', rocket.position[1] * scale + offsetX);
            rocketCircle.setAttribute('cy', rocket.position[0] * scale);
            rocketCircle.setAttribute('r', '4');
            rocketCircle.setAttribute('fill', rocket.intercepted ? 'green' : `hsl(${rocketIdx * 60}, 100%, 50%)`);
            svg.appendChild(rocketCircle);

            if (rocket.intercepted) {
                const interceptMark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                interceptMark.setAttribute('x', rocket.position[1] * scale + offsetX);
                interceptMark.setAttribute('y', rocket.position[0] * scale);
                interceptMark.setAttribute('font-size', '12');
                interceptMark.setAttribute('fill', 'red');
                interceptMark.setAttribute('text-anchor', 'middle');
                interceptMark.setAttribute('dominant-baseline', 'central');
                interceptMark.textContent = 'X';
                svg.appendChild(interceptMark);
            }

            // Update rocket's previous position for next frame
            previousPositions.current[rocketIdx] = rocket.position;
        });
    };

    const createLine = (x1, y1, x2, y2, color) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        return line;
    };

    const createCircle = (cx, cy, r, color, opacity = 1) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', opacity);
        return circle;
    };

    const createRect = (x, y, width, height, color) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', color);
        return rect;
    };

    const createHouse = (cx, cy) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const roof = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        roof.setAttribute('points', `
            ${cx - 7},${cy}
            ${cx + 7},${cy}
            ${cx},${cy - 10}
        `);
        roof.setAttribute('fill', 'brown');
        group.appendChild(roof);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', cx - 5);
        body.setAttribute('y', cy);
        body.setAttribute('width', 10);
        body.setAttribute('height', 10);
        body.setAttribute('fill', 'red');
        group.appendChild(body);

        return group;
    };

    const createText = (x, y, text, color) => {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', x);
        textElement.setAttribute('y', y);
        textElement.setAttribute('fill', color);
        textElement.setAttribute('font-size', '10');
        textElement.textContent = text;
        return textElement;
    };

    return (
        <div className="App">
            <h1>Air Defense Simulation</h1>
            <h3>Iteration {simulationData[currentFrame]?.iteration}, Time Step {simulationData[currentFrame]?.time_step + 1}</h3>

            <div className="slider-container">
                <label htmlFor="speed-slider">Animation Speed:</label>
                <input
                    id="speed-slider"
                    type="range"
                    min="100"
                    max="2000"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                />
                <span>{speed} ms/frame</span>
            </div>

            <svg ref={svgRef} width={1500} height={1500} style={{ border: '1px solid black' }}>
                {/* SVG elements will be dynamically generated here */}
            </svg>
        </div>
    );
};

export default App;
