// frontend/src/components/SupportFab.jsx
import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function SupportFab() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  if (!user) return null; // no mostrar si no hay sesión

  const handleClick = () => {
    if (user.role === 'OPERATOR') {
      navigate('/support/operator');
    } else if (user.role === 'CONSUMER' || user.role === 'PROVIDER') {
      navigate('/support/my');
    } else {
      // por si aparece otro rol
      navigate('/support/my');
    }
  };

  return (
    <Tooltip title="Soporte y ayuda" placement="left">
      <Fab
        color="primary"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300, // por encima del contenido
          boxShadow: 4,
        }}
      >
        <SupportAgentIcon />
      </Fab>
    </Tooltip>
  );
}

export default SupportFab;