import { redirect } from "next/navigation";

/** Root route simply redirects to the Dashboard, the app's landing page. */
export default function RootPage(): never {
  redirect("/dashboard");
}
