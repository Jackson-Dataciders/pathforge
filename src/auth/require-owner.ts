import type { Session } from "next-auth";
import { auth } from "./index";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireOwner(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.githubId) throw new UnauthorizedError();
  return session;
}

export function withOwner<Args extends unknown[]>(
  handler: (...args: Args) => Response | Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      await requireOwner();
      return await handler(...args);
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) throw error;
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  };
}