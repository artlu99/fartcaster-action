import redis from "./redis.js";

export async function makeExplicit(fld: string, fid: number) {
  const id = fid.toString();
  await redis.sadd(fld, id );
}

export async function restoreDefault(fld: string, fid: number) {
  // the default state, i.e., before anything gets specified
  const id = fid.toString();
  await redis.srem(fld, id ); 
}

export async function optIn(category: string, fid: number) {
  const id = fid.toString();
  await redis.hset(category, {[id]: 1} );
}

export async function optOut(category: string, fid: number) {
  // 0 is not specified, not opt-out
  const id = fid.toString();
  await redis.hset(category, {[id]: -1} );
}
