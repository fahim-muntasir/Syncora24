import type { Namespace } from "socket.io";
import { tokenValidator } from "../lib/auth";
import type { UserType } from "../types/user";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAuthenticatedUser(value: unknown): UserType | null {
  if (!isRecord(value)) return null;

  const { id, fullName, email, role, updatedAt, createdAt } = value;
  if (
    typeof id !== "string" ||
    typeof fullName !== "string" ||
    typeof email !== "string" ||
    typeof role !== "string" ||
    !(typeof updatedAt === "string" || updatedAt instanceof Date) ||
    !(typeof createdAt === "string" || createdAt instanceof Date)
  ) {
    return null;
  }

  return { id, fullName, email, role, updatedAt, createdAt };
}

export function authenticateRoomSocket(
  namespace: Namespace,
): void {
  namespace.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (typeof token !== "string" || token.length === 0) {
      next(new Error("Authentication required."));
      return;
    }

    try {
      const decoded = await tokenValidator(token);
      const user = getAuthenticatedUser(decoded);
      if (!user) {
        next(new Error("Invalid token payload."));
        return;
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(
        new Error(
          error instanceof Error ? error.message : "Socket authentication failed.",
        ),
      );
    }
  });
}
