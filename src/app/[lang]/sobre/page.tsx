import { redirect } from "next/navigation";
import { asLang, lp } from "@/i18n";

export default async function SobrePage({ params }: PageProps<"/[lang]/sobre">) {
  redirect(lp(asLang((await params).lang), "/sobre/como-funciona"));
}
