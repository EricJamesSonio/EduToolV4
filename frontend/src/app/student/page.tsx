import { redirect } from "next/navigation";

export default function StudentIndexPage(): never {
  redirect("/student/classes");
}