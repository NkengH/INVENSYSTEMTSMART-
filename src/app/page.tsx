import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.mustChangePassword) {
      redirect("/change-password");
    }
    if (session.role === "Administrator") redirect("/admin");
    if (session.role === "Inventory Manager") redirect("/inventory-manager");
    if (session.role === "Cashier") redirect("/cashier");
    redirect("/admin");
  }

  return (
    <div className="login-page">
      <PublicHeader />

      <div className="login-card">
        <LoginForm />
      </div>

      <PublicFooter />
    </div>
  );
}
