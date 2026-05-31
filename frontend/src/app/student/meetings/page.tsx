import { redirect } from "next/navigation";

export default function StudentMeetingsRedirectPage() {
  redirect("/student/classes");
}
