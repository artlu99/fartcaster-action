import redis from "./redis.js";

export async function fart(fid: number, username: string) {
  const id = fid.toString();
  await redis.zincrby("farts", 1, id);
  await redis.hset("usernames", { [id]: username });
}

export async function candle(fid: number, username: string) {
  const id = fid.toString();
  await redis.zincrby("farts", -1, id);
  await redis.hset("usernames", { [id]: username });
}
