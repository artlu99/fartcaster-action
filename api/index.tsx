import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { pinata } from "frog/hubs";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";
import { PinataFDK } from "pinata-fdk";
import { candle, fart } from "../lib/fart.js";
import { countShields, giveShield, isShielded } from "../lib/shields.js";
import { Box, Heading, HStack, Text, VStack, vars } from "../lib/ui.js";
import redis from "../lib/redis.js";
import { isKind, setKind, unsetKind } from "../lib/kindness.js";
import { getOpt, optIn, optOut } from "../lib/userSettings.js";
import { FCANResponse, fcan } from "../lib/fcan.js";
import { isWiseKing } from "../lib/wisekings.js";
import { getUsername } from "../lib/username.js";

const ADD_URL =
  process.env.ADD_URL ??
  "https://warpcast.com/~/add-cast-action?url=https://fartcaster-action.vercel.app/api/fart";

const REPO_URL =
  process.env.REPO_URL ?? "https://github.com/artlu99/fartcaster-action";

const PINATA_JWT = process.env.PINATA_JWT ?? "";

const PudgyPizzaDelivery = () =>
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjl1eXI2cjIxaDBkZWkzb2V2cjZjY20wbzd2Y2V1YmZzanVlMmkwbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vwCa7HNSi1J16IOGO3/giphy.gif";

const fdk = new PinataFDK({
  pinata_jwt: PINATA_JWT,
  pinata_gateway: "",
});

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  hub: pinata(),
  browserLocation: ADD_URL,
});

// Cast action handler
app.castAction(
  "/fart",
  async (c) => {
    const {
      verified,
      actionData: {
        fid: actionFid,
        castId: { fid: castFid },
      },
    } = c;

    if (verified) {
      const { username } = await fdk.getUserByFid(castFid);

      const kindMode = await isKind(actionFid);
      const adsOption = await getOpt("ads", actionFid);

      if (adsOption === 1) {
        return c.res({ type: "frame", path: "/advert" });
      }

      let message = "preparing to Fart...";
      if (castFid === actionFid) {
        const farts = (await redis.zscore("farts", actionFid)) ?? 0;
        if (farts < 0) {
          // you are negative already
          return c.res({ type: "frame", path: "/on-fire" });
        }

        candle(castFid, username);
        message = "Lit candle, 1 fart removed.";
      } else {
        const isCastAuthorShielded = await isShielded(castFid);
        if (isCastAuthorShielded) {
          const { username: actionUsername } = await fdk.getUserByFid(
            actionFid
          );
          fart(actionFid, actionUsername);
          message =
            `${username} farted ` +
            (kindMode ? "in your general direction" : "on you!");
          if (message.length > 80) {
            message = "Shields up!";
          }
          return c.message({ message });
        } else {
          fart(castFid, username);
          message =
            "You farted " +
            (kindMode
              ? `in the general direction of ${username}`
              : `on ${username}`);
          if (message.length > 80) {
            message = "Farted!";
          }
        }
      }
      return c.message({ message });
    } else {
      return c.error({ message: "Unauthorized" });
    }
  },
  {
    name: "Fart",
    icon: "flame",
    description: "Fart on casts, show results on a leaderboard.",
    aboutUrl: REPO_URL,
  }
);

// Frame handlers
app.frame("/", async (c) => {
  const fid = c.frameData?.fid ?? 0;
  const wiseKingFlag = await isWiseKing(fid);

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
    intents: wiseKingFlag
      ? [
          <Button.AddCastAction action="/fart">
            Add Action
          </Button.AddCastAction>,
          <Button value="leaderboard" action="/leaderboard">
            💨 Leaderboard
          </Button>,
          <Button value="wisekings" action="/wisekings">
            🗝️👑
          </Button>,
          <Button value="cpanel" action="/cpanel">
            🎛️ Controls
          </Button>,
        ]
      : [
          <Button.AddCastAction action="/fart">
            Add Action
          </Button.AddCastAction>,
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
  const leaders: number[] = await redis.zrange("farts", 0, 3, {
    rev: true,
    withScores: true,
  });

  const firstName = await getUsername(leaders[0]);
  const secondName = await getUsername(leaders[2]);
  const thirdName = await getUsername(leaders[4]);

  const fid = c.frameData?.fid ?? 0;
  let farts = 0;
  try {
    farts = (await redis.zscore("farts", fid)) ?? 0;
  } catch (e) {}
  let possiblyShielded = "";
  try {
    possiblyShielded = (await isShielded(fid)) ? "🛡️" : "";
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
  const most: number[] = await redis.zrange("farts", 0, 10, {
    rev: true,
    withScores: true,
  });

  // this code probably fails badly if it's run on a redis store without enough data
  const most0 = await getUsername(most[0]);
  const most1 = await getUsername(most[2]);
  const most2 = await getUsername(most[4]);
  const most3 = await getUsername(most[6]);
  const most4 = await getUsername(most[8]);
  const most5 = await getUsername(most[10]);
  const most6 = await getUsername(most[12]);
  const most7 = await getUsername(most[14]);
  const most8 = await getUsername(most[16]);
  const most9 = await getUsername(most[18]);

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
  if (buttonValue === "set") {
    await setKind(fid);
  } else if (buttonValue === "unset") {
    await unsetKind(fid);
  }

  const username = await getUsername(fid, fdk);
  const kindMode = await isKind(fid);

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
          {kindMode ? "I choose to be kind" : "I am direct"}
        </Text>
      </Box>
    ),
    intents: [
      <Button.Reset>⬅️ Back</Button.Reset>,
      <Button value={kindMode ? "unset" : "set"}>
        {kindMode ? "Be direct" : "Be kind"}
      </Button>,
      <Button action="/opt-in-out-logging">Next 👉</Button>,
    ],
  });
});

app.frame("/opt-in-out-logging", async (c) => {
  const fid = c.frameData?.fid ?? 0;

  const { buttonValue } = c;
  if (buttonValue === "in") {
    await optIn("logging", fid);
  } else if (buttonValue === "out") {
    await optOut("logging", fid);
  }

  const loggingOption = await getOpt("logging", fid);
  const optionText =
    loggingOption === 1
      ? "opted In"
      : loggingOption === -1
      ? "opted Out"
      : "none";

  return c.res({
    action: "/opt-in-out-logging",
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <Heading color="fcPurple" align="center" size="48">
          FID {fid}: {optionText}
        </Heading>
        <Text align="center" size="24">
          In: log FID of all fart actions
        </Text>
        <Text align="center" size="24">
          Out: do not log any fart action
        </Text>
        <Text align="center" size="24">
          not yet specified: do not log any fart action
        </Text>
      </Box>
    ),
    intents:
      loggingOption === 1
        ? [
            <Button action="/cpanel">⬅️ Back</Button>,
            <Button value="out">Opt Out</Button>,
            <Button action="/opt-in-out-ads">Next 👉</Button>,
          ]
        : loggingOption === -1
        ? [
            <Button action="/cpanel">⬅️ Back</Button>,
            <Button value="in">Opt In</Button>,
            <Button action="/opt-in-out-ads">Next 👉</Button>,
          ]
        : [
            <Button action="/cpanel">⬅️ Back</Button>,
            <Button value="in">Opt In</Button>,
            <Button value="out">Opt Out</Button>,
            <Button action="/opt-in-out-ads">Next 👉</Button>,
          ],
  });
});

app.frame("/opt-in-out-ads", async (c) => {
  const fid = c.frameData?.fid ?? 0;

  const { buttonValue } = c;
  if (buttonValue === "in") {
    await optIn("ads", fid);
  } else if (buttonValue === "out") {
    await optOut("ads", fid);
  }

  const adsOption = await getOpt("ads", fid);
  const optionText =
    adsOption === 1 ? "opted In" : adsOption === -1 ? "opted Out" : "none";

  return c.res({
    action: "/opt-in-out-ads",
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <Heading color="fcPurple" align="center" size="48">
          FID {fid}: {optionText}
        </Heading>
        <Text align="center" size="24">
          In: be shown advertisements, log FID
        </Text>
        <Text align="center" size="24">
          Out: no ads, do not log
        </Text>
        <Text align="center" size="24">
          not yet specified: no ads, do not log
        </Text>
      </Box>
    ),
    intents:
      adsOption === 1
        ? [
            <Button action="/opt-in-out-logging">⬅️ Back</Button>,
            <Button value="out">Opt Out</Button>,
          ]
        : adsOption === -1
        ? [
            <Button action="/opt-in-out-logging">⬅️ Back</Button>,
            <Button value="in">Opt In</Button>,
          ]
        : [
            <Button action="/opt-in-out-logging">⬅️ Back</Button>,
            <Button value="in">Opt In</Button>,
            <Button value="out">Opt Out</Button>,
          ],
  });
});

app.frame("/wisekings", async (c) => {
  const fid = c.frameData?.fid ?? 0;

  const username = await getUsername(fid, fdk);
  const wiseKingFlag = await isWiseKing(fid);

  return c.res({
    action: "/transfer-shield",
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <Heading color="fcPurple" align="center" size="32">
          {username}: {wiseKingFlag ? "Wise King 🗝️👑" : "not a Wise King"}
        </Heading>
        {wiseKingFlag ? (
          <VStack>
            <Text align="center" size="24">
              type 2 FIDs to transfer a shield
            </Text>
            <Text align="center" size="24">
              e.g., 6546:3
            </Text>
          </VStack>
        ) : undefined}
      </Box>
    ),
    intents: wiseKingFlag
      ? [
          <Button.Reset>⬅️ Back</Button.Reset>,
          <Button value="Submit">Go</Button>,
          <TextInput placeholder="6546:3" />,
        ]
      : [<Button.Reset>⬅️ Back</Button.Reset>],
  });
});

app.frame("/transfer-shield", async (c) => {
  const { inputText } = c;

  const [fromFid, toFid] = inputText
    ? inputText.split(":")
    : [undefined, undefined];

  const fid = c.frameData?.fid ?? 0;
  const wiseKingFlag = await isWiseKing(fid);

  const attemptTransferFlag = wiseKingFlag && fromFid && toFid;
  if (attemptTransferFlag) {
    await giveShield(parseInt(fromFid), parseInt(toFid));
  }

  const shieldsCount = await countShields();

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(138, 99, 210)"
      >
        <Heading color="fcPurple" align="center" size="32">
          {wiseKingFlag ? "Wise King 🗝️👑" : "not a Wise King"}
        </Heading>
        {wiseKingFlag ? (
          <VStack>
            <Text align="center" size="24">
              there are {shieldsCount} shields
            </Text>
            <Text align="center" size="24">
              {attemptTransferFlag
                ? "shield transferred"
                : "no shields transferred"}
            </Text>
          </VStack>
        ) : undefined}
      </Box>
    ),
    intents: [<Button.Reset>⬅️ Start Over</Button.Reset>],
  });
});

app.frame("/advert", async (c) => {
  const { verified, frameData } = c;
  if (verified && frameData) {
    const {
      fid: actionFid,
      // castId: { fid: castFid, hash: castHash },
    } = frameData;

    const advert: FCANResponse = await fcan(actionFid);

    return c.res({
      image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="white"
          padding="32"
          border="1em solid rgb(138, 99, 210)"
        >
          <Heading color="fcPurple" align="center" size="48">
            {advert.head}
          </Heading>
          <Text align="center" size="32">
            {advert.text}
          </Text>
        </Box>
      ),
      intents: advert.attribUrl
        ? [
            <Button.Link href={`${advert.displayUrl}`}>
              Not tracked
            </Button.Link>,
            <Button.Link href={`https://fcan.xyz/r?id=${advert.id}`}>Tracked</Button.Link>,
            <Button.Link href={`https://fcan.xyz/transparency?id=${advert.id}`}>
              FCAN
            </Button.Link>,
          ]
        : [
            <Button.Link href={`${advert.displayUrl}`}>
              Not tracked
            </Button.Link>,
            <Button.Link href={`https://fcan.xyz/transparency?id=${advert.id}`}>
              FCAN
            </Button.Link>,
          ],
    });
  } else {
    return c.error({ message: "Unauthorized" });
  }
});

app.frame("/on-fire", async (c) => {
  const { verified, frameData } = c;
  if (verified && frameData) {
    const {
      fid: actionFid,
      // castId: { fid: castFid, hash: castHash },
    } = frameData;

    const farts = (await redis.zscore("farts", actionFid)) ?? 0;

    return c.res({
      image: PudgyPizzaDelivery(),
      intents: [
        <Button>🕯️ knocked over</Button>,
        <Button value="leaderboard" action="/leaderboard">
          💨 Leaderboard
        </Button>,
        <Button>Room on 🔥</Button>,
      ],
    });
  } else {
    return c.error({ message: "Unauthorized" });
  }
});

// this was a dynamically-generated landing image which got cached as a 404
app.get(
  "/image&s=724507676c1e1d0d8f0e14b0e8021672b2b9b4e76b7569cfd8ce0e5d58cf5556",
  (c) =>
    c.redirect("https://r2.channel-frames.fcan.xyz/farts-action-landing.png")
);

// delete this after 1 week when cache has cleared for original frame
app.frame("/farts", async (c) => {
  const fid = c.frameData?.fid ?? 0;
  let farts = 0;
  try {
    farts = (await redis.zscore("farts", fid)) ?? 0;
  } catch (e) {}
  let possiblyShielded = "";
  try {
    possiblyShielded = (await isShielded(fid)) ? "🛡️" : "";
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
