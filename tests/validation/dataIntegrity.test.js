import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient } from "../../src/apiClient.js";
import { uniqueCandidateId } from "../helpers/candidate.js";
import { authenticate, cleanupVideos, createTrackedVideo } from "../helpers/videoHelpers.js";

test("video creation preserves submitted title data", async () => {
  const createdIds = [];
  const client = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("title") }));
  const title = `QA title ${Date.now()}`;

  try {
    const response = await createTrackedVideo(client, createdIds, { title });

    assert.equal(response.status, 201);
    assert.equal(response.data.title, title, "created video should store and return the submitted title");
  } finally {
    await cleanupVideos(client, createdIds);
  }
});

test("GET /api/videos honors the limit query parameter", async () => {
  const createdIds = [];
  const client = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("limit") }));

  try {
    await createTrackedVideo(client, createdIds, { title: "one" });
    await createTrackedVideo(client, createdIds, { title: "two" });
    await createTrackedVideo(client, createdIds, { title: "three" });

    const response = await client.listVideos({ limit: 1, token: undefined });

    assert.equal(response.status, 200);
    assert.equal(response.data.length, 1, "limit=1 should return exactly one video");
  } finally {
    await cleanupVideos(client, createdIds);
  }
});

test("duplicate caption processing requests are rejected while a job is active", async () => {
  const createdIds = [];
  const client = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("duplicate-process") }));

  try {
    const createResponse = await createTrackedVideo(client, createdIds);
    const firstProcess = await client.processCaptions(createResponse.data.id);
    assert.equal(firstProcess.status, 202);

    const secondProcess = await client.processCaptions(createResponse.data.id);
    assert.ok(
      [400, 409, 423].includes(secondProcess.status),
      `duplicate processing should be rejected, got ${secondProcess.status}`
    );
  } finally {
    await cleanupVideos(client, createdIds);
  }
});

test("deleting a nonexistent video reports not found", async () => {
  const client = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("delete-missing") }));
  const response = await client.deleteVideo("00000000-0000-4000-8000-000000000000", { token: undefined });

  assert.equal(response.status, 404, "DELETE should not return success for a missing video");
});
