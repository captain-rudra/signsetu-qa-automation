# SignSetu QA API Test Suite

JavaScript automated tests for the SignSetu Video Caption Processing Pipeline final round.

## Tech Stack

- Node.js built-in `node:test`
- Native `fetch`
- No runtime dependencies

## Setup

```bash
npm test
```

The sandbox currently contains intentional defects, so `npm test` exits non-zero and the failed assertions are the vulnerability report.

Optional environment variables:

```bash
API_BASE_URL=https://qa-testing-navy.vercel.app
PROCESSING_TIMEOUT_MS=12000
POLL_INTERVAL_MS=1000
REQUEST_TIMEOUT_MS=10000
```

## Folder Structure

```text
src/
  apiClient.js          # Small API wrapper that always sends X-Candidate-ID
  config.js             # Runtime configuration
tests/
  e2e/                  # Full workflow coverage
  helpers/              # Candidate IDs, auth, cleanup, polling
  security/             # Auth and isolation attacks
  validation/           # Data integrity and input validation checks
```

## Testing Strategy

Every test run generates unique candidate IDs so the suite is repeatable and avoids the API's state-collision trap. The helper client injects `X-Candidate-ID` into every request, including negative security checks.

The suite first validates the expected lifecycle: authenticate, create a video, trigger caption processing, poll until processing completes, fetch captions, and delete the video. The caption job is asynchronous, so polling uses the list endpoint with a bounded timeout and interval. Cleanup runs in `finally` blocks and uses the same candidate context to keep the sandbox tidy even when assertions fail.

The security and validation tests assert the behavior a production API should have. Because the sandbox intentionally contains bugs, several tests are expected to fail and identify the vulnerabilities below.

## Bugs Caught

1. `POST /api/videos` accepts unauthenticated requests and creates records.
2. `POST /api/videos/{id}/process-captions` accepts unauthenticated requests.
3. `DELETE /api/videos/{id}` accepts unauthenticated requests.
4. `GET /api/captions?videoId={id}` accepts unauthenticated requests.
5. One candidate can delete another candidate's video by ID.
6. The async caption job does not transition to `completed` within the exposed repeatable workflow, and captions remain empty.
7. The bearer token expires after 5 seconds, but processing completion is scheduled after that window, making protected status checks unreliable.
8. `POST /api/videos` ignores submitted video data such as `title` and always returns `New Video`.
9. `GET /api/videos?limit=1` ignores the `limit` parameter.
10. Duplicate caption-processing requests are accepted while a job is already active.
11. `DELETE /api/videos/{missing-id}` returns `204` instead of `404`.
