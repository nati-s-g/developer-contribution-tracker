import "server-only";
import { githubFetch } from "./client";

/**
 * Retrieves the authenticated viewer's GitHub username (login).
 * "My contributions" always resolves to this identity directly from the GitHub API.
 * Never accepts a login from client parameters to prevent identity spoofing.
 */
export async function getViewerLogin(): Promise<string> {
  const result = await githubFetch<{ login: string }>("/user");
  return result.data.login;
}
