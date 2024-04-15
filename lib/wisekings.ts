import redis from "./redis.js";

export async function isWiseKing(fid: number): Promise<boolean> {
    const id = fid.toString();
    const kind = await redis.sismember("wisekeys", id);
    return !!kind
  }
