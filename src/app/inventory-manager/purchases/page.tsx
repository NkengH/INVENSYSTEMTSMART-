import { getLowStockProducts, getPurchaseHistory } from "@/app/actions/purchases";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PurchaseManagement } from "./PurchaseManagement";

export const dynamic = "force-dynamic";

export default async function PurchaseManagementPage() {
  const session = await getSession();
  if (!session || (session.role !== "Inventory Manager" && session.role !== "Administrator")) {
    redirect("/");
  }

  const [lowStockProducts, purchaseHistory] = await Promise.all([
    getLowStockProducts(),
    getPurchaseHistory(),
  ]);

  return (
    <PurchaseManagement
      lowStockProducts={lowStockProducts}
      purchaseHistory={purchaseHistory}
      username={session.username}
    />
  );
}

