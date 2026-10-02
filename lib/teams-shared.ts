// Safe to import from client components (no server-only modules).
export type Role = "owner" | "admin" | "viewer";
export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", viewer: "Viewer" };
