import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as guideApi from '@/api/platform/guide.api';
import type { GuidePortal, CreateGuideDto, UpdateGuideDto, CreateGuideStepDto, UpdateGuideStepDto } from '@/types/platform/guide.types';

export function useGuides(portal?: GuidePortal) {
  return useQuery({
    queryKey: ['platform-guides', portal],
    queryFn: () => guideApi.getGuides(portal),
  });
}

export function useGuide(id: string) {
  return useQuery({
    queryKey: ['platform-guide', id],
    queryFn: () => guideApi.getGuide(id),
    enabled: !!id,
  });
}

export function useGuideBySlug(slug: string) {
  return useQuery({
    queryKey: ['platform-guide-slug', slug],
    queryFn: () => guideApi.getGuideBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGuideDto) => guideApi.createGuide(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-guides'] });
      toast.success('Guide created');
    },
    onError: () => {
      toast.error('Failed to create guide');
    },
  });
}

export function useUpdateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGuideDto }) =>
      guideApi.updateGuide(id, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['platform-guides'] });
      qc.invalidateQueries({ queryKey: ['platform-guide', vars.id] });
      toast.success('Guide updated');
    },
    onError: () => {
      toast.error('Failed to update guide');
    },
  });
}

export function useDeleteGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guideApi.deleteGuide(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-guides'] });
      toast.success('Guide deleted');
    },
    onError: () => {
      toast.error('Failed to delete guide');
    },
  });
}

export function useCreateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guideId, dto }: { guideId: string; dto: CreateGuideStepDto }) =>
      guideApi.createStep(guideId, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['platform-guide', vars.guideId] });
      toast.success('Step added');
    },
    onError: () => {
      toast.error('Failed to add step');
    },
  });
}

export function useUpdateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, dto }: { stepId: string; dto: UpdateGuideStepDto }) =>
      guideApi.updateStep(stepId, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['platform-guide'] });
      toast.success('Step updated');
    },
    onError: () => {
      toast.error('Failed to update step');
    },
  });
}

export function useDeleteStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, guideId }: { stepId: string; guideId: string }) =>
      guideApi.deleteStep(stepId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['platform-guide', vars.guideId] });
      toast.success('Step deleted');
    },
    onError: () => {
      toast.error('Failed to delete step');
    },
  });
}
