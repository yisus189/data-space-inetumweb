function validateContractIsCurrentlyUsable(contract, now = new Date()) {
  if (!contract) {
    const err = new Error('No existe contrato para este recurso');
    err.status = 403;
    throw err;
  }

  if (contract.status !== 'ACTIVE') {
    const err = new Error('El contrato no está activo');
    err.status = 403;
    throw err;
  }

  if (contract.effectiveFrom && contract.effectiveFrom > now) {
    const err = new Error('El contrato todavía no está vigente');
    err.status = 403;
    throw err;
  }

  if (contract.effectiveTo && contract.effectiveTo < now) {
    const err = new Error('El contrato ha expirado');
    err.status = 403;
    throw err;
  }
}

module.exports = {
  validateContractIsCurrentlyUsable
};
