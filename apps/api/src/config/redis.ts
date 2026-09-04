/**
 * Redis is not wired in this milestone.
 * When session/cache work begins, connect here using env.REDIS_URL.
 */
export function assertRedisConfigured() {
  throw new Error("Redis is not enabled yet.");
}
