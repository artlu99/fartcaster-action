import redis from "./redis.js";
import { makeExplicit, restoreDefault } from "./userSettings.js";

export async function isKind(fid: number): Promise<boolean> {
    const id = fid.toString();
    const kind = await redis.sismember("kind", id);
    return !!kind
  }

export async function setKind(fid: number) {
    await makeExplicit("kind", fid)
}

export async function unsetKind(fid: number) {
    await restoreDefault("kind", fid)
}