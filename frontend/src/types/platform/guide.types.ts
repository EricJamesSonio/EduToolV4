export type GuidePortal = 'admin' | 'student' | 'educator';

export interface GuideStep {
  id: string;
  orderIndex: number;
  title: string | null;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  portal: GuidePortal;
  pagePath: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps: GuideStep[];
}

export interface GuideListItem {
  id: string;
  portal: GuidePortal;
  pagePath: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stepCount: number;
}

export interface CreateGuideDto {
  portal: GuidePortal;
  pagePath: string;
  title: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGuideDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateGuideStepDto {
  orderIndex: number;
  title?: string;
  text: string;
  imageUrl?: string;
}

export interface UpdateGuideStepDto {
  orderIndex?: number;
  title?: string;
  text?: string;
  imageUrl?: string;
}
