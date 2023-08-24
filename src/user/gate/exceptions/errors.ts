export default {
  NOT_FOUND: {
    error: 'NOT_FOUND',
    reason: 'Gate not found',
    code: 'GATE.001',
    statusCode: 400,
  },
  FAILED_CREATE: {
    error: 'FAILED_TO_CREATE',
    reason: 'Gate failed to create',
    code: 'GATE.002',
    statusCode: 500,
  },
  FAILED_UPDATE: {
    error: 'FAILED_UPDATE',
    reason: 'Gate failed to update',
    code: 'GATE.003',
    statusCode: 500,
  },
  FAILED_DELETE: {
    error: 'FAILED_DELETE',
    reason: 'Gate failed to delete',
    code: 'GATE.004',
    statusCode: 500,
  },
  NAME_REQUIRED: {
    error: 'NAME_REQUIRED',
    reason: 'Name required',
    code: 'GATE.005',
    statusCode: 400,
  },
  LEVEL_REQUIRED: {
    error: 'LEVEL_REQUIRED',
    reason: 'Level required',
    code: 'GATE.006',
    statusCode: 400,
  },
  PROVIDER_REQUIRED: {
    error: 'PROVIDER_REQUIRED',
    reason: 'Provider required',
    code: 'GATE.007',
    statusCode: 400,
  },
  GATE_REQUIRED: {
    error: 'GATE_REQUIRED',
    reason: 'Gate required',
    code: 'GATE.008',
    statusCode: 400,
  },
  LEVEL_MINIMUM: {
    error: 'LEVEL_MINIMUM',
    reason: 'Level minimum limit',
    code: 'GATE.009',
    statusCode: 400,
  },
  LEVEL_MAXIMUM: {
    error: 'LEVEL_MAXIMUM',
    reason: 'Level maximum limit',
    code: 'GATE.010',
    statusCode: 400,
  },
};
