import { API_BASE_URL } from "@/config/api.config";

export function getOrgLogoUrl(logoUrl?: string | null): string {
  if (!logoUrl) return `${API_BASE_URL}/uploads/organizations/default.png`;
  return `${API_BASE_URL}/uploads/${logoUrl}`;
}
