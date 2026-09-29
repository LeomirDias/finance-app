import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lançamentos",
};

export default function LancamentosRedirectPage() {
  redirect("/gastos");
}
