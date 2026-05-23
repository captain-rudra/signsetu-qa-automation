import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient } from "../../src/apiClient.js";
import { uniqueCandidateId } from "../helpers/candidate.js";
import {
  assertNotFoundOrForbidden,
  authenticate,
  cleanupVideos,
  createTrackedVideo
} from "../helpers/videoHelpers.js";

test("one candidate cannot fetch another candidate's video", async () => {
  const ownerIds = [];
  const owner = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("owner-read") }));
  const attacker = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("attacker-read") }));

  try {
    const createResponse = await createTrackedVideo(owner, ownerIds);
    const response = await attacker.getVideo(createResponse.data.id);

    assert.equal(response.status, 404);
  } finally {
    await cleanupVideos(owner, ownerIds);
  }
});

test("one candidate cannot delete another candidate's video", async () => {
  const ownerIds = [];
  const owner = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("owner-delete") }));
  const attacker = await authenticate(new ApiClient({ candidateId: uniqueCandidateId("attacker-delete") }));

  try {
    const createResponse = await createTrackedVideo(owner, ownerIds);
    const response = await attacker.deleteVideo(createResponse.data.id);

    assertNotFoundOrForbidden(response, "cross-candidate delete should be blocked");

    const ownerRead = await owner.getVideo(createResponse.data.id);
    assert.equal(ownerRead.status, 200, "owner's video should still exist after blocked attacker delete");
  } finally {
    await cleanupVideos(owner, ownerIds);
  }
});
