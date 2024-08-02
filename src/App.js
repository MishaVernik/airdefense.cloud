import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const App = () => {
    const [simulationData, setSimulationData] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [speed, setSpeed] = useState(500); // Speed in milliseconds per frame
    const svgRef = useRef(null);
    const previousPositions = useRef({});

    // Offset and scale settings
    const offsetX = 50; // Shift the grid rightward
    const offsetY = 50; // Shift the grid downward
    const scale = 50; // Scale factor for the grid

    useEffect(() => {
        // Fetch the simulation data from the backend
        // fetch('http://localhost:8000/api/run-simulation/')
        fetch('https://airdefense-backend-ghexf2eagme5gfg5.eastus-01.azurewebsites.net/api/run-simulation/')
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
            const svg = svgRef.current;

            // Clear previous frame's content
            svg.innerHTML = '';

            // Draw grid, towers, targets, and rockets
            drawGrid(svg, frameData, scale);
            drawTowers(svg, frameData.towers, scale);
            drawTargets(svg, frameData.targets, scale);
            drawRockets(svg, frameData.rockets, scale);
        }
    }, [currentFrame]);

    const drawGrid = (svg, frameData, scale) => {
        for (let i = 0; i <= frameData.N; i++) {
            // Horizontal grid lines
            svg.appendChild(createLine(offsetX, offsetY + i * scale, offsetX + frameData.M * scale, offsetY + i * scale, 'lightgray'));
            // Vertical grid lines
            svg.appendChild(createLine(offsetX + i * scale, offsetY, offsetX + i * scale, offsetY + frameData.N * scale, 'lightgray'));
            // Y-axis labels
            svg.appendChild(createText(offsetX - 20, offsetY + i * scale + 5, `${i}`, 'black', 14));
            // X-axis labels
            svg.appendChild(createText(offsetX + i * scale - 10, offsetY + frameData.N * scale + 20, `${i}`, 'black', 14));
        }
    };

    const drawTowers = (svg, towers, scale) => {
        towers.forEach(tower => {
            const [x, y] = tower;
            svg.appendChild(createCircle(offsetX + y * scale, offsetY + x * scale, 1.5 * scale, 'blue', 0.2)); // Radius circle
            svg.appendChild(createRect(offsetX + y * scale - 7, offsetY + x * scale - 7, 14, 14, 'blue')); // Tower
        });
    };

    const drawTargets = (svg, targets, scale) => {
        targets.forEach(target => {
            const [x, y] = target;
            svg.appendChild(createHouse(offsetX + y * scale, offsetY + x * scale));
        });
    };

    const drawRockets = (svg, rockets, scale) => {
        rockets.forEach((rocket, idx) => {
            const path = rocket.path; // Full path of the rocket
            const intercepted = rocket.intercepted;
            let lastPosition = rocket.start;

            // Draw the trajectory up to the current position or the interception point
            for (let i = 1; i < path.length && !intercepted; i++) {
                const [prevX, prevY] = path[i - 1];
                const [currX, currY] = path[i];
                svg.appendChild(createLine(
                    offsetX + prevY * scale,
                    offsetY + prevX * scale,
                    offsetX + currY * scale,
                    offsetY + currX * scale,
                    `hsl(${idx * 60}, 100%, 50%)`
                ));
                lastPosition = [currX, currY];
            }

            if (intercepted) {
                // Mark intercepted rocket with 'K' at the interception point
                svg.appendChild(createText(offsetX + lastPosition[1] * scale, offsetY + lastPosition[0] * scale, 'K', 'red', 20));
            } else {
                // Draw the rocket at the current position with direction indicator
                const direction = getRocketDirection(rocket.start, rocket.end);
                svg.appendChild(createTriangle(offsetX + lastPosition[1] * scale, offsetY + lastPosition[0] * scale, direction, `hsl(${idx * 60}, 100%, 50%)`));
            }
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
            ${cx - 15},${cy}
            ${cx + 15},${cy}
            ${cx},${cy - 20}
        `);
        roof.setAttribute('fill', 'brown');
        group.appendChild(roof);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', cx - 10);
        body.setAttribute('y', cy);
        body.setAttribute('width', 20);
        body.setAttribute('height', 20);
        body.setAttribute('fill', 'red');
        group.appendChild(body);

        return group;
    };

    const createText = (x, y, text, color, fontSize = 14) => {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', x);
        textElement.setAttribute('y', y);
        textElement.setAttribute('fill', color);
        textElement.setAttribute('font-size', fontSize);
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'central');
        textElement.textContent = text;
        return textElement;
    };

    const createTriangle = (cx, cy, direction, color) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        triangle.setAttribute('fill', color);
        triangle.setAttribute('transform', `rotate(${direction}, ${cx}, ${cy})`);

        const points = [
            `${cx - 7},${cy + 10}`, // Bottom left
            `${cx + 7},${cy + 10}`, // Bottom right
            `${cx},${cy - 10}`      // Top
        ];

        triangle.setAttribute('points', points.join(' '));
        group.appendChild(triangle);

        return group;
    };

    const getRocketDirection = (start, end) => {
        const [x1, y1] = start;
        const [x2, y2] = end;
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        return angle + 90; // Rotate to point in the direction of movement
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

            <svg ref={svgRef} width={800} height={800} style={{ border: '1px solid black' }}>
                {/* SVG elements will be dynamically generated here */}
            </svg>
        </div>
    );
};

export default App;
