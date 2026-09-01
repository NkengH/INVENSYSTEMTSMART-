import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "Cashier") {
    redirect("/");
  }

  return (
    <DashboardLayout role={session.role} username={session.username}>
      {children}
    </DashboardLayout>
  );
}
