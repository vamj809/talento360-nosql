import Redis from "ioredis";

let redisClient: Redis | null = null;
let unavailableUntil = 0;

function getRedisUrl() {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

function markRedisUnavailable() {
  unavailableUntil = Date.now() + 15_000;
  redisClient?.disconnect();
  redisClient = null;
}

async function getRedisClient(): Promise<Redis | null> {
  if (Date.now() < unavailableUntil) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(getRedisUrl(), {
      connectTimeout: 1000,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisClient.on("error", () => undefined);
  }

  try {
    if (redisClient.status === "wait" || redisClient.status === "end") {
      await redisClient.connect();
    }

    if (redisClient.status !== "ready") {
      return null;
    }

    return redisClient;
  } catch {
    markRedisUnavailable();
    return null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  try {
    return await client.get(key);
  } catch {
    markRedisUnavailable();
    return null;
  }
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
) {
  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch {
    markRedisUnavailable();
    return false;
  }
}

export async function redisDelete(key: string) {
  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch {
    markRedisUnavailable();
    return false;
  }
}

export async function getRedisStatus(): Promise<"connected" | "unavailable"> {
  const client = await getRedisClient();
  if (!client) {
    return "unavailable";
  }

  try {
    await client.ping();
    return "connected";
  } catch {
    markRedisUnavailable();
    return "unavailable";
  }
}
