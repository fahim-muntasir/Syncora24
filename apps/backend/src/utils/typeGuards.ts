import { UserType } from "../types/user";

// Define the type guard
export function isUserType(decoded: any): decoded is UserType {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    typeof decoded.id === "string" &&
    typeof decoded.fullName === "string" &&
    typeof decoded.email === "string" &&
    typeof decoded.role === "string" &&
    (typeof decoded.updatedAt === "string" ||
      decoded.updatedAt instanceof Date) &&
    (typeof decoded.createdAt === "string" || decoded.createdAt instanceof Date)
  );
}