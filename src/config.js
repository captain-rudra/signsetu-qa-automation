export const config = {
  baseUrl: process.env.API_BASE_URL ?? "https://qa-testing-navy.vercel.app",
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 10000),
  processingTimeoutMs: Number(process.env.PROCESSING_TIMEOUT_MS ?? 12000),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 1000)
};
