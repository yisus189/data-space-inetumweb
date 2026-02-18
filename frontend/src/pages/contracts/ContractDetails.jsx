// frontend/src/pages/contracts/ContractDetails.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { getContractById } from '../../api/contractsApi.js';
import OdrlPolicyEditor from '../../components/contracts/OdrlPolicyEditor.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function ContractDetails() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const loadContract = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getContractById(id);
      setContract(data);
    } catch (err) {
      setError(err.message || 'Error al cargar contrato');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !contract) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No se encontró el contrato.</Typography>
      </Box>
    );
  }

  const isProvider =
    user?.id === contract.providerId && user?.role === 'PROVIDER';
  const isOperator = user?.role === 'OPERATOR';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Contrato #{contract.id}
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Dataset: {contract.dataset?.name || contract.datasetId}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Provider: {contract.provider?.email} (id {contract.providerId})
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Consumer: {contract.consumer?.email} (id {contract.consumerId})
      </Typography>

      <OdrlPolicyEditor
        contract={contract}
        readOnly={!(isProvider || isOperator)}
      />
    </Box>
  );
}

export default ContractDetails;