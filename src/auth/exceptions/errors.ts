export default {
  INVALID_CREDENTIALS: {
    error: 'INVALID_CREDENTIALS',
    reason: 'Invalid credentials',
    code: '401.1',
    statusCode: 401,
  },

  USER_EXISTS: {
    error: 'USER_EXISTS',
    reason: 'User exists',
    code: '409.1',
    statusCode: 401,
  },

  INVALID_CONFIRM_TOKEN: {
    error: 'INVALID_CONFIRM_TOKEN',
    reason: 'Invalid confirm token',
    code: '401.2',
    statusCode: 401,
  },

  USER_DOES_NOT_EXIST: {
    error: 'USER_DOES_NOT_EXIST',
    reason: 'User does not exist',
    code: '404.1',
    statusCode: 404,
  },

  INVALID_FORGOT_PASSWORD_TOKEN: {
    error: 'INVALID_FORGOT_PASSWORD_TOKEN',
    reason: 'Invalid forgot password token',
    code: '401.3',
    statusCode: 401,
  },
};
