// frontend/src/components/contracts/OdrlPolicyEditor.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  getContractOdrlPolicy,
  setContractOdrlPolicy,
} from '../../api/contractsApi.js';

/**
 * Props:
 * - contract: { id, datasetId, providerId, consumerId, ... }
 * - readOnly?: boolean -> si true, solo muestra, no deja guardar
 */
function OdrlPolicyEditor({ contract, readOnly = false }) {
  const [purpose, setPurpose] = useState('improve-transport-routes');
  const [daysToRetain, setDaysToRetain] = useState(30);
  const [prohibitRedistribution, setProhibitRedistribution] = useState(true);
  const [rawPolicy, setRawPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const contractId = contract?.id;

  const loadPolicy = async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError('');
      const policy = await getContractOdrlPolicy(contractId);
      setRawPolicy(policy || null);

      if (policy) {
        // Intentamos precargar campos a partir del JSON-LD
        try {
          const perm = policy.permission?.[0];
          const purposeC = perm?.constraint?.find(
            (c) => c.leftOperand === 'purpose',
          );
          const deleteDuty = perm?.duty?.find((d) => d.action === 'delete');
          const elapsedC = deleteDuty?.constraint?.find(
            (c) => c.leftOperand === 'elapsedTime',
          );

          if (purposeC?.rightOperand) {
            setPurpose(purposeC.rightOperand);
          }
          if (elapsedC?.rightOperand?.startsWith('P')) {
            const num = parseInt(elapsedC.rightOperand.slice(1, -1), 10);
            if (!Number.isNaN(num)) {
              setDaysToRetain(num);
            }
          }
          const prohibitDuty = perm?.duty?.find(
            (d) => d.action === 'prohibit',
          );
          setProhibitRedistribution(!!prohibitDuty);
        } catch {
          // si falla el parseo, ignoramos; el JSON se muestra igual abajo
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar política ODRL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const buildPolicyJson = () => {
    const target = `urn:dataspace:dataset:${contract.datasetId}`;
    const assigner = `urn:dataspace:user:${contract.providerId}`;
    const assignee = `urn:dataspace:user:${contract.consumerId}`;

    const permission = {
      target,
      action: 'use',
      constraint: [
        {
          leftOperand: 'purpose',
          operator: 'eq',
          rightOperand: purpose,
        },
      ],
      duty: [
        {
          action: 'delete',
          constraint: [
            {
              leftOperand: 'elapsedTime',
              operator: 'lteq',
              rightOperand: `P${daysToRetain}D`,
            },
          ],
        },
      ],
    };

    if (prohibitRedistribution) {
      permission.duty.push({
        action: 'prohibit',
        constraint: [
          {
            leftOperand: 'system',
            operator: 'eq',
            rightOperand: 'redistribution',
          },
        ],
      });
    }

    return {
      '@context': 'http://www.w3.org/ns/odrl.jsonld',
      uid: `urn:odrl:policy:contract-${contractId}`,
      type: 'Set',
      target,
      assigner,
      assignee,
      permission: [permission],
    };
  };

  const handleSave = async () => {
    if (!contractId) return;
    try {
      setSaving(true);
      setError('');
      const policy = buildPolicyJson();
      await setContractOdrlPolicy(contractId, policy);
      setRawPolicy(policy);
    } catch (err) {
      setError(err.message || 'Error al guardar política ODRL');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Condiciones de uso (ODRL)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define los permisos, restricciones y obligaciones para el uso de este
        dataset según el estándar ODRL.
      </Typography>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading && (
        <Typography variant="body2" color="text.secondary">
          Cargando política ODRL...
        </Typography>
      )}

      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          <TextField
            label="Propósito de uso"
            select
            size="small"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            disabled={readOnly}
          >
            <MenuItem value="improve-transport-routes">
              Mejorar rutas de transporte
            </MenuItem>
            <MenuItem value="analytics">Análisis general</MenuItem>
            <MenuItem value="research">Investigación</MenuItem>
          </TextField>

          <TextField
            label="Días máximos de retención de datos"
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            value={daysToRetain}
            onChange={(e) =>
              setDaysToRetain(Number(e.target.value) || 1)
            }
            disabled={readOnly}
          />

          <TextField
            label="Prohibir redistribución"
            size="small"
            select
            value={prohibitRedistribution ? 'yes' : 'no'}
            onChange={(e) =>
              setProhibitRedistribution(e.target.value === 'yes')
            }
            disabled={readOnly}
          >
            <MenuItem value="yes">Sí, prohibir redistribución</MenuItem>
            <MenuItem value="no">No, permitir redistribución</MenuItem>
          </TextField>

          {!readOnly && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar política ODRL'}
            </Button>
          )}
        </Box>
      )}

      {/* Vista del JSON-LD bruto */}
      {rawPolicy && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Política ODRL (JSON-LD):
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: '#f5f5f5',
              fontSize: 12,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(rawPolicy, null, 2)}
          </Box>
        </>
      )}

      {!rawPolicy && !loading && (
        <Typography variant="body2" color="text.secondary">
          No hay una política ODRL definida todavía para este contrato.
        </Typography>
      )}
    </Paper>
  );
}

export default OdrlPolicyEditor;