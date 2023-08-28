export default {
  NOT_FOUND: {
    error: 'NOT_FOUND',
    reason: 'User not found',
    code: 'USER.001',
    statusCode: 400,
  },
  FAILED_CREATE: {
    error: 'FAILED_TO_CREATE',
    reason: 'User failed to create',
    code: 'USER.002',
    statusCode: 500,
  },
  FAILED_UPDATE: {
    error: 'FAILED_UPDATE',
    reason: 'User failed to update',
    code: 'USER.003',
    statusCode: 500,
  },
  FAILED_DELETE: {
    error: 'FAILED_DELETE',
    reason: 'User failed to delete',
    code: 'USER.004',
    statusCode: 500,
  },
};
