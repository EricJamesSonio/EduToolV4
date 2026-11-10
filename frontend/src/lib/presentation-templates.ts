export interface TemplateStyle {
  label: string;
  image: string;
}

export type TemplatePalette = readonly [string, string, string];

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

export const DEFAULT_PALETTE: TemplatePalette = ["#A4CE45", "#7FB03A", "#5E8F2A"];

export const TEMPLATE_PALETTES: Record<string, TemplatePalette> = {
  green: ["#A4CE45", "#7FB03A", "#5E8F2A"],
  blue: ["#7DB7F0", "#4A90D9", "#2F68B0"],
  pink: ["#F7A8C8", "#EE7CAB", "#D4508A"],
  bluegreen: ["#7FD3C9", "#3FB0A8", "#2A7F9E"],
  purple: ["#C3A0EA", "#9C6FD6", "#7646B5"],
  red: ["#F4A09A", "#E5645A", "#C23B32"],
  blueyellow: ["#FFE07A", "#F5B82E", "#2F6DB5"],
};