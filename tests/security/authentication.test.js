import test from "node:test";
import { ApiClient } from "../../src/apiClient.js";
import { uniqueCandidateId } from "../helpers/candidate.js";
import {
  assertUnauthorized,
  authenticate,
  cleanupVideos,
  createTrackedVideo
} from "../helpers/videoHelpers.js";

test("creating a video requires a valid bearer token", async () => {
  const createdIds = [];
  const client = new ApiClient({ candidateId: uniqueCandidateId("auth-create") });

  try {
    const response = await createTrackedVideo(client, createdIds, {
      title: "Should not be created without auth"
    });

    assertUnauthorized(response, "unauthenticated create should be rejected");
  } finally {
    await cleanupVideos(client, createdIds);
  }
});

test("caption processing requires a valid bearer token", async () => {
  const createdIds = [];
  const authedClient = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("auth-process") }));
  const unauthenticatedClient = new ApiClient({ candidateId: authedClient.candidateId });

  try {
    const createResponse = await createTrackedVideo(authedClient, createdIds);
    const response = await unauthenticatedClient.processCaptions(createResponse.data.id);

    assertUnauthorized(response, "unauthenticated processing should be rejected");
  } finally {
    await cleanupVideos(authedClient, createdIds);
  }
});

test("deleting a video requires a valid bearer token", async () => {
  const createdIds = [];
  const authedClient = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("auth-delete") }));
  const unauthenticatedClient = new ApiClient({ candidateId: authedClient.candidateId });

  try {
    const createResponse = await createTrackedVideo(authedClient, createdIds);
    const response = await unauthenticatedClient.deleteVideo(createResponse.data.id);

    assertUnauthorized(response, "unauthenticated delete should be rejected");
  } finally {
    await cleanupVideos(authedClient, createdIds);
  }
});

test("captions for a video require a valid bearer token", async () => {
  const createdIds = [];
  const authedClient = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("auth-captions") }));
  const unauthenticatedClient = new ApiClient({ candidateId: authedClient.candidateId });

  try {
    const createResponse = await createTrackedVideo(authedClient, createdIds);
    const response = await unauthenticatedClient.getCaptions(createResponse.data.id);

    assertUnauthorized(response, "unauthenticated captions lookup should be rejected");
  } finally {
    await cleanupVideos(authedClient, createdIds);
  }
});
