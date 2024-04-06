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

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?name=Fart&icon=flame&actionType=post&postUrl=https://fartcaster-action.vercel.app/api/fart";

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
        🏆 Leaderboard
      </Button>,
      <Button value="start" action="/farts">
        💨 My Farts
      </Button>,
    ],
  });
});

app.frame("/leaderboard", async (c) => {
  const leaders = await redis.zrange("farts", 0, 5, {rev: true, withScores: true});
  const [firstFid, firstScore, secondFid, secondScore, thirdFid, thirdScore,
    fourthFid, fourthScore, fifthFid, fifthScore
  ] =
    leaders;

  const firstName = await redis.hget("usernames", firstFid);
  const secondName = await redis.hget("usernames", secondFid);
  const thirdName = await redis.hget("usernames", thirdFid);
  const fourthName = await redis.hget("usernames", fourthFid);
  const fifthName = await redis.hget("usernames", fifthFid);

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
              🥇 {firstName}: {firstScore} 💨💨💨
            </Text>
            <Text align="left" size="32">
              🥈 {secondName}: {secondScore} 💨💨
            </Text>
            <Text align="left" size="32">
              🥉 {thirdName}: {thirdScore} 💨
            </Text>
            <Text align="left" size="32">
              🥉 {fourthName}: {fourthScore} 💨
            </Text>
            <Text align="left" size="32">
              🥉 {fifthName}: {fifthScore} 💨
            </Text>
          </Box>
        </VStack>
      </Box>
    ),
    intents: [<Button.Reset>⬅️ Back</Button.Reset>],
  });
});

app.frame("/farts", async (c) => {
  const fid = c.var.interactor?.fid ?? 0;
  let farts = "0";
  try {
    farts = await redis.zscore("farts", fid) ?? "0";
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
            Your Farts:
          </Heading>
          <Text align="center" size="32">
            {farts}
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
