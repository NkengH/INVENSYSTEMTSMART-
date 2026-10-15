import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // If user does not need to change password, redirect to their role dashboard
  if (!session.mustChangePassword) {
    if (session.role === "Administrator") redirect("/admin");
    if (session.role === "Inventory Manager") redirect("/inventory-manager");
    if (session.role === "Cashier") redirect("/cashier");
    redirect("/");
  }

  return (
    <div className="login-page">
      <PublicHeader />

      <div className="login-card">
        <ChangePasswordForm username={session.username} role={session.role} />
      </div>

      <PublicFooter />
    </div>
  );
}
