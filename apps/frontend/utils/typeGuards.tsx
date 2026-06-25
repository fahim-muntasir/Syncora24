import { AuthResponse } from "@/types/auth";


// Type guard function
export function isAuthResponse(response: unknown): response is AuthResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    typeof (response as Record<string, unknown>).code === "number" &&
    typeof (response as Record<string, unknown>).data === "object" &&
    typeof ((response as Record<string, unknown>).data as Record<string, unknown>).token === "string" &&
    typeof ((response as Record<string, unknown>).data as Record<string, unknown>).user === "object" &&
    typeof (((response as Record<string, { user: unknown }>).data.user as Record<string, unknown>).id) === "string" &&
    typeof ((response as Record<string, { user: unknown }>).data.user as Record<string, unknown>).fullName === "string" &&
    typeof ((response as Record<string, { user: unknown }>).data.user as Record<string, unknown>).email === "string" &&
    typeof ((response as Record<string, { user: unknown }>).data.user as Record<string, unknown>).role === "string" &&
    typeof ((response as Record<string, { user: unknown }>).data.user as Record<string, unknown>).createdAt === "string" &&
    typeof ((response as Record<string, { user: unknown }>).data.user as Record<string, unknown>).updatedAt === "string" &&
    typeof (response as Record<string, unknown>).links === "object" &&
    typeof ((response as Record<string, unknown>).links as Record<string, unknown>).self === "string" &&
    typeof (response as Record<string, unknown>).message === "string" &&
    typeof (response as Record<string, unknown>).success === "boolean"
  );
}