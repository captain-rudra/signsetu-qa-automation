import { config } from "./config.js";

export class ApiClient {
  constructor({ candidateId, token, baseUrl = config.baseUrl } = {}) {
    if (!candidateId) {
      throw new Error("candidateId is required");
    }

    this.candidateId = candidateId;
    this.token = token;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  withToken(token) {
    return new ApiClient({
      candidateId: this.candidateId,
      token,
      baseUrl: this.baseUrl
    });
  }

  async request(method, path, { body, token = this.token, headers = {} } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    const requestHeaders = {
      "X-Candidate-ID": this.candidateId,
      ...headers
    };

    if (body !== undefined) {
      requestHeaders["Content-Type"] = "application/json";
    }

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });

      const text = await response.text();
      const data = parseBody(text);

      return {
        status: response.status,
        ok: response.ok,
        data,
        text,
        headers: response.headers
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  auth() {
    return this.request("POST", "/api/auth");
  }

  listVideos({ limit, token = this.token } = {}) {
    const query = limit === undefined ? "" : `?limit=${encodeURIComponent(limit)}`;
    return this.request("GET", `/api/videos${query}`, { token });
  }

  createVideo(body, { token = this.token } = {}) {
    return this.request("POST", "/api/videos", { body, token });
  }

  getVideo(videoId, { token = this.token } = {}) {
    return this.request("GET", `/api/videos/${encodeURIComponent(videoId)}`, { token });
  }

  processCaptions(videoId, { token = this.token } = {}) {
    return this.request("POST", `/api/videos/${encodeURIComponent(videoId)}/process-captions`, { token });
  }

  getCaptions(videoId, { token = this.token } = {}) {
    return this.request("GET", `/api/captions?videoId=${encodeURIComponent(videoId)}`, { token });
  }

  deleteVideo(videoId, { token = this.token } = {}) {
    return this.request("DELETE", `/api/videos/${encodeURIComponent(videoId)}`, { token });
  }
}

function parseBody(text) {
  if (!text) {
    return "";
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
