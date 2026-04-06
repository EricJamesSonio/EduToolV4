// app/admin/school-years/[id]/levels/_components/get-count-config.ts

type CountConfig = {
  label: string;
  default: number;
  min: number;
  max: number;
  preview: (n: number) => string;
};

export function getCountConfig(type: string): CountConfig {
  switch (type) {
    case "elementary":
      return {
        label: "Number of grades",
        default: 6,
        min: 1,
        max: 12,
        preview: (n) => `Grade 1 → Grade ${n}`,
      };
    case "high_school":
      return {
        label: "Number of grades",
        default: 4,
        min: 1,
        max: 6,
        preview: (n) => `Grade 7 → Grade ${6 + n}`,
      };
    case "senior_high":
      return {
        label: "Number of grades",
        default: 2,
        min: 1,
        max: 2,
        preview: (n) => (n === 1 ? "Grade 11" : "Grade 11, Grade 12"),
      };
    case "college":
      return {
        label: "Number of years",
        default: 4,
        min: 1,
        max: 5,
        preview: (n) => {
          const o = ["1st", "2nd", "3rd", "4th", "5th"];
          return `${o[0]} Year → ${o[n - 1]} Year`;
        },
      };
    default:
      return {
        label: "Number of levels",
        default: 3,
        min: 1,
        max: 20,
        preview: (n) => `1 → ${n}`,
      };
  }
}