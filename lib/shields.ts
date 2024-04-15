import redis from "./redis.js";

export async function countShields(): Promise<number> {
  const count = await redis.scard("shielded") ?? 0
  return count
}

export async function isShielded(fid: number): Promise<boolean> {
  const id = fid.toString();
  const shielded = await redis.sismember("shielded", id);
  return !!shielded
}

export async function giveShield(fromFid: number, toFid: number) {
  // does not succeed if the fromFid does not hold a shield
  // does not return an error

  const fromId= fromFid.toString()
  const toId= toFid.toString();
  
  // this function assumes redis calls are atomic and successful
  if (await isShielded(fromFid)) {
    await redis.sadd("shielded", toId)
    await redis.srem("shielded", fromId)
  }
}
