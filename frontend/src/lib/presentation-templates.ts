export interface TemplateStyle {
  label: string;
  image: string;
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  green: {
    label: "Green",
    image: "/templates/green.png",
  },
  blue: {
    label: "Blue",
    image: "/templates/blue.png",
  },
  pink: {
    label: "Pink",
    image: "/templates/pink.png",
  },
};
