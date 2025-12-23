import { redirect } from "next/navigation";

export default function ThankYouPage() {
  redirect("/checkout/success");
}
