import apiClient from '@/api/client';
import type {
  Guide,
  GuideListItem,
  CreateGuideDto,
  UpdateGuideDto,
  CreateGuideStepDto,
  UpdateGuideStepDto,
} from '@/types/platform/guide.types';

export async function getGuides(portal?: string): Promise<GuideListItem[]> {
  const params = portal ? { portal } : {};
  const res = await apiClient.get('/platform/guides', { params });
  return res.data.data;
}

export async function getGuide(id: string): Promise<Guide> {
  const res = await apiClient.get(`/platform/guides/${id}`);
  return res.data.data;
}

export async function getGuideBySlug(slug: string): Promise<Guide> {
  const res = await apiClient.get(`/platform/guides/slug/${slug}`);
  return res.data.data;
}

export async function createGuide(dto: CreateGuideDto): Promise<Guide> {
  const res = await apiClient.post('/platform/guides', dto);
  return res.data.data;
}

export async function updateGuide(
  id: string,
  dto: UpdateGuideDto,
): Promise<Guide> {
  const res = await apiClient.patch(`/platform/guides/${id}`, dto);
  return res.data.data;
}

export async function deleteGuide(id: string): Promise<void> {
  await apiClient.delete(`/platform/guides/${id}`);
}

export async function createStep(
  guideId: string,
  dto: CreateGuideStepDto,
): Promise<Guide['steps'][0]> {
  const res = await apiClient.post(`/platform/guides/${guideId}/steps`, dto);
  return res.data.data;
}

export async function updateStep(
  stepId: string,
  dto: UpdateGuideStepDto,
): Promise<Guide['steps'][0]> {
  const res = await apiClient.patch(`/platform/guides/steps/${stepId}`, dto);
  return res.data.data;
}

export async function deleteStep(stepId: string): Promise<void> {
  await apiClient.delete(`/platform/guides/steps/${stepId}`);
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post('/platform/guides/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}
