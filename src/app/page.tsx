import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.role === "Administrator") redirect("/admin");
    if (session.role === "Inventory Manager") redirect("/inventory-manager");
    if (session.role === "Cashier") redirect("/cashier");
    redirect("/admin");
  }

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-card" style={{ maxWidth: 460 }}>
        {/* Brand */}
        <div className="login-logo" style={{ marginBottom: 20 }}>
          <div className="login-logo-icon">I</div>
          <div>
            <div className="login-logo-text">INVENSMART AI</div>
            <div className="login-logo-sub">Smart AI-Assisted Inventory Management System</div>
          </div>
        </div>

        <h1 className="login-heading" style={{ fontSize: "1.35rem", marginBottom: 4 }}>Welcome back</h1>
        <p className="login-subheading" style={{ marginBottom: 20 }}>Sign in to access your role-based workspace</p>

        <LoginForm />
      </div>
    </div>
  );
}
