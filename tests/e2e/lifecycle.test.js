import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient } from "../../src/apiClient.js";
import { uniqueCandidateId } from "../helpers/candidate.js";
import {
  authenticate,
  cleanupVideos,
  createTrackedVideo,
  waitForVideoInList
} from "../helpers/videoHelpers.js";

test("video caption lifecycle completes and returns generated captions", async () => {
  const createdIds = [];
  const client = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("lifecycle") }));

  try {
    const createResponse = await createTrackedVideo(client, createdIds, {
      title: "Lifecycle caption test"
    });

    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.data.status, "pending");
    assert.equal(createResponse.data.candidate_id, client.candidateId);

    const processResponse = await client.processCaptions(createResponse.data.id);
    assert.equal(processResponse.status, 202);

    const completedVideo = await waitForVideoInList(client, createResponse.data.id);
    assert.ok(completedVideo, "video should eventually move from processing to completed");
    assert.equal(completedVideo.status, "completed");
    assert.ok(completedVideo.processing_complete_at, "completed video should keep completion timestamp");

    const captionsResponse = await client.getCaptions(createResponse.data.id, { token: undefined });
    assert.equal(captionsResponse.status, 200);
    assert.ok(Array.isArray(captionsResponse.data), "captions response should be an array");
    assert.ok(captionsResponse.data.length > 0, "completed video should expose generated captions");
  } finally {
    await cleanupVideos(client, createdIds);
  }
});
