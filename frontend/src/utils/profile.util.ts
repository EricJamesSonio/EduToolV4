import { API_BASE_URL } from "@/config/api.config";

export function getProfileImageUrl(profileImage?: string | null): string {
  if (!profileImage) return `${API_BASE_URL}/uploads/profile/default.png`;
  return `${API_BASE_URL}/uploads/${profileImage}`;
}
