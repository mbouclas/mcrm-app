export default {
  CUSTOMER_PAYMENT_METHOD_EXISTS: {
    error: 'CUSTOMER_PAYMENT_METHOD_EXISTS',
    reason: 'Customer payment method exists',
    code: '400.100',
    statusCode: 400,
  },

  CUSTOMER_PAYMENT_METHOD_FAILED_CREATE: {
    error: 'CUSTOMER_PAYMENT_METHOD_FAILED_CREATE',
    reason: 'Customer payment method failed to create',
    code: '400.101',
    statusCode: 400,
  },

  CUSTOMER_DOES_NOT_EXIST: {
    error: 'CUSTOMER_DOES_NOT_EXIST',
    reason: 'Customer does not exist',
    code: '400.102',
    statusCode: 400,
  },

  PROVIDER_PAYMENT_METHOD_DOES_NOT_EXIST: {
    error: 'PROVIDER_PAYMENT_METHOD_DOES_NOT_EXIST',
    reason: 'Provider payment method does not exist',
    code: '400.103',
    statusCode: 400,
  },
};
