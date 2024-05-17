import { PinataFDK } from "pinata-fdk";
import redis from "./redis.js";

export const getUsername = async (
  fid: number,
  fdk?: PinataFDK
): Promise<string | undefined> => {
  const id = fid.toString();
  const knownUsername: string | null = await redis.hget("usernames", id);
  if (knownUsername) return knownUsername;

  if (fdk) {
    const { username } = await fdk.getUserByFid(fid);
    if (username) {
      await redis.hset("usernames", { [id]: username });
      return username;
    }
  }
  return;
};
