// src/components/Map.js
import React from 'react';
import styled from 'styled-components';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MapContainer = styled.div`
    width: 100%;
    height: 400px;
    margin-top: 20px;
`;

function Map({ simulationData, currentFrame }) {
    if (!simulationData || !simulationData[currentFrame]) return null;

    const frame = simulationData[currentFrame];
    const { towers, targets, rockets } = frame;

    // Generate data for recharts
    const data = rockets.map((rocket, idx) => ({
        name: `Rocket ${idx + 1}`,
        x: rocket.position[1],
        y: rocket.position[0],
        intercepted: rocket.intercepted ? 'Intercepted' : 'Not Intercepted'
    }));

    return (
        <MapContainer>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis dataKey="y" />
                    <Tooltip />
                    <Line type="monotone" dataKey="y" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </MapContainer>
    );
}

export default Map;
