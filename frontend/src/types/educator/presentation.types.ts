export interface Presentation {
  id: string;
  orgId: string;
  classId: string;
  lessonId: string;
  title: string;
  template: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
}

export interface Slide {
  id: string;
  presentationId: string;
  slideNumber: number;
  title: string | null;
  content: string;
  lessonSection: string | null;
  image?: string | null;
  thumbnail?: string | null;
  poster?: string | null;
  createdAt: string;
}

export interface CreatePresentationRequest {
  lessonId: string;
  title: string;
  template?: string;
  settings?: Record<string, any>;
}

export interface UpdatePresentationRequest {
  title?: string;
  template?: string;
  settings?: Record<string, any>;
}

export interface SlideAssignment {
  slideNumber: number;
  title?: string;
  content: string;
  lessonSection?: string;
}

export interface GenerateSlidesRequest {
  slides: SlideAssignment[];
}
