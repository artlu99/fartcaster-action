import redis from "./redis.js";

export async function attestIsAdult(fid: number) {
  const id = fid.toString();
  await redis.sadd("nsfw", id );
}

export async function requestSfw(fid: number) {
  const id = fid.toString();
  await redis.srem("nsfw", id );
}

export async function isAdult(fid: number): Promise<boolean> {
  const id = fid.toString();
  const nsfw = await redis.sismember("nsfw", id);
  return !!nsfw
}
