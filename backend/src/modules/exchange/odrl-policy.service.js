function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeAction(action) {
  return normalizeText(action);
}

function extractActionId(actionItem) {
  if (!actionItem) return '';
  if (typeof actionItem === 'string') return normalizeAction(actionItem);
  if (typeof actionItem === 'object') {
    return normalizeAction(
      actionItem.value || actionItem.id || actionItem['@id'] || actionItem.name || ''
    );
  }
  return '';
}

function valuesMatch(operator, actual, expected) {
  const op = normalizeText(operator || 'eq');
  const left = normalizeText(actual);

  if (op === 'isanyof') {
    return asArray(expected).map(normalizeText).includes(left);
  }

  const right = normalizeText(expected);

  if (op === 'neq') {
    return left !== right;
  }

  return left === right;
}

function restrictionMatchesPurpose(restriction, context) {
  if (normalizeText(restriction.leftOperand) !== 'purpose') return true;
  return valuesMatch(restriction.operator, context.purpose, restriction.rightOperand);
}

function restrictionMatchesAssignee(restriction, context) {
  if (normalizeText(restriction.leftOperand) !== 'assignee') return true;
  return valuesMatch(restriction.operator, context.assignee, restriction.rightOperand);
}

function restrictionMatchesAssigner(restriction, context) {
  if (normalizeText(restriction.leftOperand) !== 'assigner') return true;
  return valuesMatch(restriction.operator, context.assigner, restriction.rightOperand);
}

function restrictionMatchesTarget(restriction, context) {
  if (normalizeText(restriction.leftOperand) !== 'target') return true;
  return valuesMatch(restriction.operator, context.target, restriction.rightOperand);
}

function restrictionMatchesDateTime(restriction, context) {
  if (normalizeText(restriction.leftOperand) !== 'datetime') return true;

  const right = restriction.rightOperand;
  if (!right) return true;

  const dateValue = new Date(right);
  if (Number.isNaN(dateValue.getTime())) return true;

  const operator = normalizeText(restriction.operator);
  if (operator === 'gteq' || operator === 'gt' || operator === 'after') {
    return context.now >= dateValue;
  }

  if (operator === 'lteq' || operator === 'lt' || operator === 'before') {
    return context.now <= dateValue;
  }

  return true;
}

function allRestrictionsPass(restrictions, context) {
  return asArray(restrictions).every(
    (restriction) =>
      restrictionMatchesPurpose(restriction, context) &&
      restrictionMatchesDateTime(restriction, context) &&
      restrictionMatchesAssignee(restriction, context) &&
      restrictionMatchesAssigner(restriction, context) &&
      restrictionMatchesTarget(restriction, context)
  );
}

function actionMatches(rule, requestedAction) {
  const actions = asArray(rule.action).map(extractActionId);
  return actions.length === 0 || actions.includes(requestedAction);
}

function evaluateOdrlPolicy(policy, context) {
  if (!policy) {
    return {
      allow: true,
      reason: 'No hay política ODRL; se permite por defecto',
      matchedRuleType: 'NONE'
    };
  }

  const requestedAction = normalizeAction(context.action);

  const permissions = asArray(policy.permission);
  const permissionRule = permissions.find((permission) => {
    if (!actionMatches(permission, requestedAction)) return false;
    return allRestrictionsPass(permission.constraint, context);
  });

  if (!permissionRule) {
    return {
      allow: false,
      reason: 'La política ODRL no concede permiso para la acción y restricciones solicitadas',
      matchedRuleType: 'NO_PERMISSION_MATCH'
    };
  }

  const prohibitions = asArray(policy.prohibition);
  const prohibitionRule = prohibitions.find((prohibition) => {
    if (!actionMatches(prohibition, requestedAction)) return false;
    return allRestrictionsPass(prohibition.constraint, context);
  });

  if (prohibitionRule) {
    return {
      allow: false,
      reason: 'La acción está prohibida por la política ODRL',
      matchedRuleType: 'PROHIBITION'
    };
  }

  return {
    allow: true,
    reason: 'Acceso permitido por política ODRL',
    matchedRuleType: 'PERMISSION'
  };
}

module.exports = {
  evaluateOdrlPolicy
};
