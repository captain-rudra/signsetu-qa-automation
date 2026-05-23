import assert from "node:assert/strict";
import { config } from "../../src/config.js";

export async function authenticate(client) {
  const response = await client.auth();

  assert.equal(response.status, 201, `auth should return 201, got ${response.status}`);
  assert.equal(typeof response.data.token, "string", "auth response should include a token");
  assert.ok(Number(response.data.expiresAt) > Date.now(), "auth expiry should be in the future");

  return client.withToken(response.data.token);
}

export async function createTrackedVideo(client, createdIds, body) {
  const response = await client.createVideo(body);

  if (response.data?.id) {
    createdIds.push(response.data.id);
  }

  return response;
}

export async function cleanupVideos(client, videoIds) {
  await Promise.allSettled(
    [...new Set(videoIds)].map((videoId) => client.deleteVideo(videoId, { token: undefined }))
  );
}

export async function waitForVideoInList(client, videoId) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < config.processingTimeoutMs) {
    const response = await client.listVideos({ limit: 100, token: undefined });
    assert.equal(response.status, 200, `video list should be available while polling, got ${response.status}`);

    const video = response.data.find((item) => item.id === videoId);
    if (video?.status === "completed") {
      return video;
    }

    await delay(config.pollIntervalMs);
  }

  return undefined;
}

export function assertUnauthorized(response, message) {
  assert.ok(
    [401, 403].includes(response.status),
    `${message}; expected 401/403 but got ${response.status} with body ${JSON.stringify(response.data)}`
  );
}

export function assertNotFoundOrForbidden(response, message) {
  assert.ok(
    [403, 404].includes(response.status),
    `${message}; expected 403/404 but got ${response.status} with body ${JSON.stringify(response.data)}`
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
