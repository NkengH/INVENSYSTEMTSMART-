import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "Administrator") {
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
