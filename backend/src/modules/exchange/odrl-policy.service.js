function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeAction(action) {
  return String(action || '').toLowerCase();
}

function extractActionId(actionItem) {
  if (!actionItem) return '';
  if (typeof actionItem === 'string') return normalizeAction(actionItem);
  if (typeof actionItem === 'object') {
    return normalizeAction(actionItem.value || actionItem.id || actionItem.name || '');
  }
  return '';
}

function restrictionMatchesPurpose(restriction, purpose) {
  if (!restriction || !restriction.leftOperand) return true;
  if (String(restriction.leftOperand).toLowerCase() !== 'purpose') return true;

  const right = String(restriction.rightOperand || '').trim().toLowerCase();
  const requestedPurpose = String(purpose || '').trim().toLowerCase();

  if (!right) return true;
  return requestedPurpose === right;
}

function restrictionMatchesDateTime(restriction, now) {
  if (!restriction || !restriction.leftOperand) return true;
  if (String(restriction.leftOperand).toLowerCase() !== 'datetime') return true;

  const right = restriction.rightOperand;
  if (!right) return true;

  const dateValue = new Date(right);
  if (Number.isNaN(dateValue.getTime())) return true;

  const operator = String(restriction.operator || '').toLowerCase();
  if (operator === 'gteq' || operator === 'gt' || operator === 'after') {
    return now >= dateValue;
  }

  if (operator === 'lteq' || operator === 'lt' || operator === 'before') {
    return now <= dateValue;
  }

  return true;
}

function allRestrictionsPass(restrictions, context) {
  return asArray(restrictions).every(
    (restriction) =>
      restrictionMatchesPurpose(restriction, context.purpose) &&
      restrictionMatchesDateTime(restriction, context.now)
  );
}

function evaluateOdrlPolicy(policy, context) {
  if (!policy) {
    return { allow: true, reason: 'No hay política ODRL; se permite por defecto' };
  }

  const requestedAction = normalizeAction(context.action);

  const permissions = asArray(policy.permission);
  const permissionMatches = permissions.some((permission) => {
    const actions = asArray(permission.action).map(extractActionId);
    const actionOk = actions.length === 0 || actions.includes(requestedAction);
    if (!actionOk) return false;
    return allRestrictionsPass(permission.constraint, context);
  });

  if (!permissionMatches) {
    return {
      allow: false,
      reason: 'La política ODRL no concede permiso para la acción y restricciones solicitadas'
    };
  }

  const prohibitions = asArray(policy.prohibition);
  const isProhibited = prohibitions.some((prohibition) => {
    const actions = asArray(prohibition.action).map(extractActionId);
    const actionMatches = actions.length === 0 || actions.includes(requestedAction);
    if (!actionMatches) return false;
    return allRestrictionsPass(prohibition.constraint, context);
  });

  if (isProhibited) {
    return {
      allow: false,
      reason: 'La acción está prohibida por la política ODRL'
    };
  }

  return {
    allow: true,
    reason: 'Acceso permitido por política ODRL'
  };
}

module.exports = {
  evaluateOdrlPolicy
};
