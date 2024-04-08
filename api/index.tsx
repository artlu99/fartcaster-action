import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { neynar as neynarHub } from "frog/hubs";
import { neynar } from "frog/middlewares";
import { handle } from "frog/vercel";
import { CastParamType, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { candle, fart, isShielded } from "../lib/fart.js";
import { Box, Heading, Text, VStack, vars } from "../lib/ui.js";
import redis from "../lib/redis.js";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "NEYNAR_API_DOCS";
const neynarClient = new NeynarAPIClient(NEYNAR_API_KEY);

const ADD_URL = process.env.ADD_URL ?? 
  "https://warpcast.com/~/add-cast-action?name=Fart&icon=flame&actionType=post&postUrl=https://fartcaster-action.vercel.app/api/fart";

const REPO_URL = process.env.REPO_URL ??
  "https://github.com/artlu99/fartcaster-action";

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  hub: neynarHub({ apiKey: NEYNAR_API_KEY }),
  browserLocation: ADD_URL,
}).use(
  neynar({
    apiKey: NEYNAR_API_KEY,
    features: ["interactor", "cast"],
  })
);

// Cast action handler
app.hono.post("/fart", async (c) => {
  const {
    trustedData: { messageBytes },
  } = await c.req.json();

  const result = await neynarClient.validateFrameAction(messageBytes);
  if (result.valid) {
    const cast = await neynarClient.lookUpCastByHashOrWarpcastUrl(
      result.action.cast.hash,
      CastParamType.Hash
    );
    const {
      cast: {
        author: { fid, username },
      },
    } = cast;

    let message = 'preparing to Fart...';
    if (result.action.interactor.fid === fid) {
      await candle(fid, username);
      message = 'Lit candle, 1 fart removed.';
    } else {
      const isCastAuthorShielded = await isShielded(fid);
      if (isCastAuthorShielded) {
        await fart(
          result.action.interactor.fid,
          result.action.interactor.username
        );
        message = `${username} farted on you!`;
        if (message.length > 30) {
          message = "Shields up!";
        }
        return c.json({ message }, 400);  
      } else {
        await fart(fid, username);
        message = `You farted on ${username}`;
        if (message.length > 30) {
          message = "Farted!";
        }
      }
    }
    return c.json({ message });  
  } else {
    return c.json({ message: "Unauthorized" }, 401);
  }
});

// Frame handlers
app.frame("/", (c) => {
  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="64">
            Farts 💨
          </Heading>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Link href={ADD_URL}>Add Action</Button.Link>,
      <Button value="leaderboard" action="/leaderboard">
        💨 Leaderboard
      </Button>,
    ],
  });
});

app.frame("/leaderboard", async (c) => {
  const leaders = await redis.zrange("farts", 0, 3, {rev: true, withScores: true});

  const firstName = await redis.hget("usernames", leaders[0]);
  const secondName = await redis.hget("usernames", leaders[2]);
  const thirdName = await redis.hget("usernames", leaders[4]);

  const fid = c.var.interactor?.fid ?? 0;
  let farts = "0";
  try {
    farts = await redis.zscore("farts", fid) ?? "0";
  } catch (e) {}
  let possiblyShielded = '';
  try {
    possiblyShielded = await redis.sismember("shielded", fid) ? '🛡️' : '';
  } catch (e) {}

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Most Farted on Users
          </Heading>
          <Box>
            <Text align="left" size="32">
              🥇 {firstName}: {leaders[1]} 💨💨💨
            </Text>
            <Text align="left" size="32">
              🥈 {secondName}: {leaders[3]} 💨💨
            </Text>
            <Text align="left" size="32">
              🥉 {thirdName}: {leaders[5]} 💨
            </Text>
          </Box>
          <Heading color="fcPurple" align="center" size="48">
            🍑💨 My Farts:
          </Heading>
          <Text align="center" size="32">
            {farts} {possiblyShielded}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Reset>⬅️ Back</Button.Reset>,
      <Button.Link href={REPO_URL}>GitHub</Button.Link>,
      <Button value="start" action="/more">
        🔟 More
      </Button>,
    ],
  });
});

app.frame("/more", async (c) => {
  const most = await redis.zrange("farts", 0, 5, {rev: true, withScores: true});
  const least = await redis.zrange("farts", 0, 5, {rev: false, withScores: true});

  // this code probably fails badly before there's enough data
  const most1 = await redis.hget("usernames", most[0]);
  const most2 = await redis.hget("usernames", most[2]);
  const most3 = await redis.hget("usernames", most[4]);
  const most4 = await redis.hget("usernames", most[6]);
  const most5 = await redis.hget("usernames", most[8]);

  const least1 = await redis.hget("usernames", least[0]);
  const least2 = await redis.hget("usernames", least[2]);
  const least3 = await redis.hget("usernames", least[4]);
  const least4 = await redis.hget("usernames", least[6]);
  const least5 = await redis.hget("usernames", least[8]);

  const usercount = await redis.hlen("usernames") ?? '0';

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Farted on {usercount} Users
          </Heading>
          <Box>
            <Text align="left" size="32">
              {most1}: {most[1]} 🍑💨
            </Text>
            <Text align="left" size="32">
              {most2}: {most[3]}
            </Text>
            <Text align="left" size="32">
              {most3}: {most[5]}
            </Text>
            <Text align="left" size="32">
              {most4}: {most[7]}
            </Text>
            <Text align="left" size="32">
              {most5}: {most[9]}
            </Text>
          </Box>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Reset>⬅️ Start Over</Button.Reset>,
      <Button.Link href={REPO_URL}>GitHub</Button.Link>,
    ],
  });
});

// delete this after 1 week when cache has cleared for original frame
app.frame("/farts", async (c) => {
  const fid = c.var.interactor?.fid ?? 0;
  let farts = "0";
  try {
    farts = await redis.zscore("farts", fid) ?? "0";
  } catch (e) {}
  let possiblyShielded = '';
  try {
    possiblyShielded = await redis.sismember("shielded", fid) ? '🛡️' : '';
  } catch (e) {}

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            🍑💨 My Farts:
          </Heading>
          <Text align="center" size="32">
            {farts} {possiblyShielded}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [<Button.Reset>⬅️ Back</Button.Reset>],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
