import type { Endpoints } from "@octokit/types";

/**
 * Octokit only returns a typed response for routes it recognizes literally.
 * We call the "get/put/delete repository content" endpoints with the
 * `{+path}` reserved-expansion form so slashes in `path` aren't
 * percent-encoded, but that form isn't in Octokit's route map, so those
 * calls fall back to an untyped response. The `{path}` route has the same
 * request/response shape, so we reuse its types for the `{+path}` calls.
 */
export type ContentsResponseData =
	Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]["data"];
export type ContentFile = Extract<ContentsResponseData, { type: "file" }>;
