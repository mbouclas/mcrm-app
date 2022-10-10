export function redisConnectionInfo() {
  return {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_AUTH,
    port: parseInt(process.env.REDIS_PORT),
    db: parseInt(process.env.REDIS_DB),
  };
}
