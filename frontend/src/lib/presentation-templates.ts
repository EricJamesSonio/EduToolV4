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
  bluegreen: {
    label: "Blue-Green",
    image: "/templates/blue-green.jpg",
  },
  purple: {
    label: "Purple",
    image: "/templates/purple.jpg",
  },
  red: {
    label: "Red",
    image: "/templates/red.jpg",
  },
  blueyellow: {
    label: "Blue-Yellow",
    image: "/templates/blue-yellow.jpg",
  },

};
