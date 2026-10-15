import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const allowedRoles = ["Cashier", "Inventory Manager", "Administrator"];
  if (!session || !allowedRoles.includes(session.role)) {
    redirect("/");
  }
  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <DashboardLayout role={session.role} username={session.username}>
      {children}
    </DashboardLayout>
  );
}
