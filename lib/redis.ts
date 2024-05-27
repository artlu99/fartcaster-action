import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.REDIS_URL ?? "https://us1-cool-ghost-37586.upstash.io",
  token: process.env.REDIS_TOKEN ?? "AZLSASQgYjJmZjE1ZmMtZGQ0MS00NzBjLTkyZGMtODFhNDUyZDQzMDhlMDc5MTQxYWI5OWJjNDBmMDk3NDdmYjlkZDYyY2Y1MjA="
});

export default redis;
