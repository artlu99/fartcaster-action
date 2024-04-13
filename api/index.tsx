import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { pinata } from "frog/hubs";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";
import { PinataFDK } from "pinata-fdk";
import { candle, fart, isShielded } from "../lib/fart.js";
import { Box, Heading, HStack, Text, VStack, vars } from "../lib/ui.js";
import { attestIsAdult, isAdult, requestSfw } from "../lib/userSettings.js";
import redis from "../lib/redis.js";

const ADD_URL =
  process.env.ADD_URL ??
  "https://warpcast.com/~/add-cast-action?name=Fart&icon=flame&actionType=post&postUrl=https://fartcaster-action.vercel.app/api/fart";

const REPO_URL =
  process.env.REPO_URL ?? "https://github.com/artlu99/fartcaster-action";

const fdk = new PinataFDK();

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  hub: pinata(),
  browserLocation: ADD_URL,
});

// Cast action handler
app.castAction("/fart", async (c) => {
  const {
    verified,
    actionData: {
      fid: actionFid,
      castId: { fid: castFid },
    },
  } = c;

  if (verified) {
    const { username } = await fdk.getUserByFid(castFid);
    const nsfwFlag = await isAdult(actionFid);

    let message = "preparing to Fart...";
    if (castFid === actionFid) {
      await candle(castFid, username);
      message = "Lit candle, 1 fart removed.";
    } else {
      const isCastAuthorShielded = await isShielded(castFid);
      if (isCastAuthorShielded) {
        const { username: actionUsername } = await fdk.getUserByFid(actionFid);
        await fart(actionFid, actionUsername);
        message =
          `${username} farted ` +
          (nsfwFlag ? "on you!" : "in your general direction");
        if (message.length > 80) {
          message = "Shields up!";
        }
        return c.res({ message, statusCode: 400 });
      } else {
        await fart(castFid, username);
        message =
          "You farted " +
          (nsfwFlag
            ? `on ${username}`
            : `in the general direction of ${username}`);
        if (message.length > 80) {
          message = "Farted!";
        }
      }
    }
    return c.res({ message });
  } else {
    return c.res({ message: "Unauthorized", statusCode: 401 });
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
      <Button value="cpanel" action="/cpanel">
        🎛️ Control Panel
      </Button>,
    ],
  });
});

app.frame("/leaderboard", async (c) => {
  const leaders = await redis.zrange("farts", 0, 3, {
    rev: true,
    withScores: true,
  });

  const firstName = await redis.hget("usernames", leaders[0]);
  const secondName = await redis.hget("usernames", leaders[2]);
  const thirdName = await redis.hget("usernames", leaders[4]);

  const fid = c.frameData?.fid ?? 0;
  let farts = 0;
  try {
    farts = (await redis.zscore("farts", fid)) ?? 0;
  } catch (e) {}
  let possiblyShielded = "";
  try {
    possiblyShielded = (await redis.sismember("shielded", fid)) ? "🛡️" : "";
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
            My Farts: {farts} {possiblyShielded} 🍑💨
          </Heading>
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
  const most = await redis.zrange("farts", 0, 10, {
    rev: true,
    withScores: true,
  });

  // this code probably fails badly before there's enough data
  const most0 = await redis.hget("usernames", most[0]);
  const most1 = await redis.hget("usernames", most[2]);
  const most2 = await redis.hget("usernames", most[4]);
  const most3 = await redis.hget("usernames", most[6]);
  const most4 = await redis.hget("usernames", most[8]);
  const most5 = await redis.hget("usernames", most[10]);
  const most6 = await redis.hget("usernames", most[12]);
  const most7 = await redis.hget("usernames", most[14]);
  const most8 = await redis.hget("usernames", most[16]);
  const most9 = await redis.hget("usernames", most[18]);

  const usercount = (await redis.hlen("usernames")) ?? 0;

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
          <Heading color="fcPurple" align="center" size="32">
            Farted on {usercount} Unique Users 🍑💨
          </Heading>
          <HStack gap="32">
            <Box>
              <Text align="left" size="32">
                {most0}: {most[1]}
              </Text>
              <Text align="left" size="32">
                {most1}: {most[3]}
              </Text>
              <Text align="left" size="32">
                {most2}: {most[5]}
              </Text>
              <Text align="left" size="32">
                {most3}: {most[7]}
              </Text>
              <Text align="left" size="32">
                {most4}: {most[9]}
              </Text>
            </Box>
            <Box>
              <Text align="left" size="32">
                {most5}: {most[11]}
              </Text>
              <Text align="left" size="32">
                {most6}: {most[13]}
              </Text>
              <Text align="left" size="32">
                {most7}: {most[15]}
              </Text>
              <Text align="left" size="32">
                {most8}: {most[17]}
              </Text>
              <Text align="left" size="32">
                {most9}: {most[19]}
              </Text>
            </Box>
          </HStack>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Reset>⬅️ Start Over</Button.Reset>,
      <Button.Link href={REPO_URL}>GitHub</Button.Link>,
    ],
  });
});

app.frame("/cpanel", async (c) => {
  const fid = c.frameData?.fid ?? 0;

  const { buttonValue } = c;
  if (buttonValue === "attest") {
    await attestIsAdult(fid);
  } else if (buttonValue === "request") {
    await requestSfw(fid);
  }

  const username = (await redis.hget("usernames", fid.toString())) as string;
  const nsfwFlag = await isAdult(fid);

  return c.res({
    action: "/cpanel",
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <Heading color="fcPurple" align="center" size="48">
          {username}
        </Heading>
        <Text align="center" size="32">
          is adult? {nsfwFlag ? "Y" : "N"}
        </Text>
      </Box>
    ),
    intents: [
      <Button.Reset>⬅️ Back</Button.Reset>,
      <Button value={nsfwFlag ? "request" : "attest"}>
        Make {nsfwFlag ? "SFW" : "NSFW"}
      </Button>,
    ],
  });
});

// delete this after 1 week when cache has cleared for original frame
app.frame("/farts", async (c) => {
  const fid = c.frameData?.fid ?? 0;
  let farts = 0;
  try {
    farts = (await redis.zscore("farts", fid)) ?? 0;
  } catch (e) {}
  let possiblyShielded = "";
  try {
    possiblyShielded = (await redis.sismember("shielded", fid)) ? "🛡️" : "";
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
