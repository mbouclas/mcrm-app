export default {
  NOT_FOUND: {
    error: 'NOT_FOUND',
    reason: 'Role not found',
    code: 'ROLE.001',
    statusCode: 400,
  },
  FAILED_CREATE: {
    error: 'FAILED_TO_CREATE',
    reason: 'Role failed to create',
    code: 'ROLE.002',
    statusCode: 500,
  },
  FAILED_UPDATE: {
    error: 'FAILED_UPDATE',
    reason: 'Role failed to update',
    code: 'ROLE.003',
    statusCode: 500,
  },
  FAILED_DELETE: {
    error: 'FAILED_DELETE',
    reason: 'Role failed to delete',
    code: 'ROLE.004',
    statusCode: 500,
  },
  NAME_REQUIRED: {
    error: 'NAME_REQUIRED',
    reason: 'Name required',
    code: 'ROLE.005',
    statusCode: 400,
  },
  LEVEL_REQUIRED: {
    error: 'LEVEL_REQUIRED',
    reason: 'Level required',
    code: 'ROLE.006',
    statusCode: 400,
  },
  DESCRIPTION_REQUIRED: {
    error: 'DESCRIPTION_REQUIRED',
    reason: 'Rescription required',
    code: 'ROLE.007',
    statusCode: 400,
  },
  ROLE_REQUIRED: {
    error: 'ROLE_REQUIRED',
    reason: 'Role required',
    code: 'ROLE.008',
    statusCode: 400,
  },
  LEVEL_MINIMUM: {
    error: 'LEVEL_MINIMUM',
    reason: 'Level minimum limit',
    code: 'ROLE.009',
    statusCode: 400,
  },
  LEVEL_MAXIMUM: {
    error: 'LEVEL_MAXIMUM',
    reason: 'Level maximum limit',
    code: 'ROLE.010',
    statusCode: 400,
  },
};
