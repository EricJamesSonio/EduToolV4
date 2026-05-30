export interface TemplateStyle {
  label: string;
  bg: string;
  text: string;
  accent: string;
  font: string;
  description: string;
  image: string;
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  green: {
    label: "Green",
    bg: "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900",
    text: "text-emerald-900 dark:text-emerald-50",
    accent: "text-emerald-600 dark:text-emerald-300",
    font: "font-sans",
    description: "Calm natural theme",
    image: "/templates/green.png",
  },
  blue: {
    label: "Blue",
    bg: "bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950 dark:to-blue-900",
    text: "text-blue-900 dark:text-blue-50",
    accent: "text-blue-600 dark:text-blue-300",
    font: "font-sans",
    description: "Cool ocean theme",
    image: "/templates/blue.png",
  },
  pink: {
    label: "Pink",
    bg: "bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-900",
    text: "text-pink-900 dark:text-pink-50",
    accent: "text-pink-600 dark:text-pink-300",
    font: "font-sans",
    description: "Warm rose theme",
    image: "/templates/pink.png",
  },
};
