import { redirect } from "next/navigation";

/** Static-export friendly root → default locale (middleware is unavailable). */
export default function RootPage() {
  redirect("/en/");
}
