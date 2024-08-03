import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const App = () => {
    const [simulationData, setSimulationData] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [speed, setSpeed] = useState(500); // Speed in milliseconds per frame
    const svgRef = useRef(null);

    // Offset and scale settings
    const offsetX = 50; // Shift the grid rightward
    const offsetY = 50; // Shift the grid downward
    const scale = 100; // Scale factor for the grid (increased for better visibility)

    useEffect(() => {
        // Fetch the simulation data from the backend
        fetch('http://localhost:8000/api/run-simulation/')
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
          drawRockets(svg, frameData.rockets, frameData.towers, scale); // Pass towers to drawRockets
      }
  }, [currentFrame]);
  

    const drawGrid = (svg, frameData, scale) => {
        // Determine the number of rows and columns based on the maximum coordinates of targets, towers, and rockets
        const allCoords = [
            ...frameData.targets,
            ...frameData.towers.map(t => [t[0], t[1]]),
            ...frameData.rockets.map(r => r.position),
            ...frameData.rockets.map(r => r.start)
        ];
        const maxRow = Math.max(...allCoords.map(coord => coord[0])) + 1;
        const maxCol = Math.max(...allCoords.map(coord => coord[1])) + 1;

        // Draw horizontal and vertical grid lines
        for (let i = 0; i <= maxRow; i++) {
            // Horizontal grid lines
            svg.appendChild(createLine(offsetX, offsetY + i * scale, offsetX + maxCol * scale, offsetY + i * scale, 'lightgray'));
        }

        for (let i = 0; i <= maxCol; i++) {
            // Vertical grid lines
            svg.appendChild(createLine(offsetX + i * scale, offsetY, offsetX + i * scale, offsetY + maxRow * scale, 'lightgray'));
        }

        // Draw X-axis labels
        for (let i = 0; i <= maxCol; i++) {
            svg.appendChild(createText(offsetX + i * scale - 10, offsetY + maxRow * scale + 20, `${i}`, 'black', 14));
        }

        // Draw Y-axis labels
        for (let i = 0; i <= maxRow; i++) {
            svg.appendChild(createText(offsetX - 20, offsetY + i * scale + 5, `${i}`, 'black', 14));
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

    const drawRockets = (svg, rockets, towers, scale) => {
      rockets.forEach((rocket, idx) => {
          const path = rocket.path; // Full path of the rocket
          let intercepted = false;
          let lastPosition = rocket.start;
  
          for (let i = 1; i < path.length; i++) {
              const [prevX, prevY] = path[i - 1];
              const [currX, currY] = path[i];
  
              // Check if the rocket is within the interception radius of any tower
              let inTowerRadius = false;
              for (let tower of towers) {
                  const [towerX, towerY] = tower;
                  const distance = Math.sqrt(
                      (currX - towerX) ** 2 + (currY - towerY) ** 2
                  );
                  if (distance <= tower[2]) { // tower[2] is the radius
                      inTowerRadius = true;
                      intercepted = true;
                      break;
                  }
              }
  
              if (intercepted) {
                  // Mark rocket as intercepted and stop drawing further
                  svg.appendChild(createText(offsetX + currY * scale, offsetY + currX * scale, 'K', 'red', 20));
                  return;
              } else {
                  // Draw the trace from the previous point to the current point
                  svg.appendChild(createLine(
                      offsetX + prevY * scale,
                      offsetY + prevX * scale,
                      offsetX + currY * scale,
                      offsetY + currX * scale,
                      `hsl(${idx * 60}, 100%, 50%)`
                  ));
  
                  // Draw the missile image at the current position
                  if (i === path.length - 1) {
                      const missileImage = createImage(
                          offsetX + currY * scale - 10,
                          offsetY + currX * scale - 10,
                          '/missile.png',
                          20, 20
                      );
                      svg.appendChild(missileImage);
                  }
              }
  
              // Update last position
              lastPosition = [currX, currY];
          }
  
          // If the rocket is at its last position and not intercepted, still show the missile image
          if (!intercepted && path.length > 0) {
              const [currX, currY] = path[path.length - 1];
              const missileImage = createImage(
                  offsetX + currY * scale - 10,
                  offsetY + currX * scale - 10,
                  '/missile.png',
                  20, 20
              );
              svg.appendChild(missileImage);
          }
      });
  };
  
  

    const createImage = (x, y, href, width, height) => {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttributeNS(null, 'x', x);
        image.setAttributeNS(null, 'y', y);
        image.setAttributeNS(null, 'width', width);
        image.setAttributeNS(null, 'height', height);
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
        return image;
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
