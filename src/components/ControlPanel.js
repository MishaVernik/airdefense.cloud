// src/components/ControlPanel.js
import React from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const Panel = styled.div`
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

function ControlPanel({ runSimulation }) {
    return (
        <Panel>
            <Button variant="contained" color="primary" onClick={runSimulation}>
                Run Simulation
            </Button>
        </Panel>
    );
}

export default ControlPanel;
