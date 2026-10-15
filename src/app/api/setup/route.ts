import { NextResponse } from "next/server";
import { connectToDatabase } from "@/db";
import { User, Category, Product, Inventory } from "@/db/schema";
import * as bcrypt from "bcrypt";
import { electronics100Products } from "@/scripts/seed100Electronics";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Ensure user accounts exist for the 3 core actors
    await User.updateMany(
      { role: { $in: ["Storekeeper", "Stock Controller"] } },
      { $set: { role: "Inventory Manager" } }
    );

    // Always upsert demo accounts so stale/corrupted password hashes are fixed
    const adminHash = await bcrypt.hash("admin123", 10);
    await User.findOneAndUpdate(
      { username: "admin" },
      { $set: { passwordHash: adminHash, role: "Administrator", isActive: true } },
      { upsert: true }
    );

    const managerHash = await bcrypt.hash("manager123", 10);
    await User.findOneAndUpdate(
      { username: "manager" },
      { $set: { passwordHash: managerHash, role: "Inventory Manager", isActive: true } },
      { upsert: true }
    );

    const cashierHash = await bcrypt.hash("cashier123", 10);
    await User.findOneAndUpdate(
      { username: "cashier" },
      { $set: { passwordHash: cashierHash, role: "Cashier", isActive: true } },
      { upsert: true }
    );

    // 2. Populate with 100 Popular Electronic Products & Stock
    const categoryCache: Record<string, any> = {};

    for (const item of electronics100Products) {
      if (!categoryCache[item.category]) {
        let cat = await Category.findOne({ name: item.category });
        if (!cat) {
          cat = await Category.create({
            name: item.category,
            description: item.categoryDesc,
          });
        }
        categoryCache[item.category] = cat;
      }

      const existingProd = await Product.findOne({ sku: item.sku });
      let prodId = existingProd?._id;

      if (!existingProd) {
        const newProd = await Product.create({
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          description: item.description,
          categoryId: categoryCache[item.category]._id,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          minimumStock: item.minimumStock,
          unit: item.unit,
          isActive: true,
        });
        prodId = newProd._id;

        await Inventory.create({
          productId: prodId,
          quantity: item.initialStock,
        });
      } else {
        existingProd.name = item.name;
        existingProd.barcode = item.barcode;
        existingProd.description = item.description;
        existingProd.purchasePrice = item.purchasePrice;
        existingProd.sellingPrice = item.sellingPrice;
        existingProd.minimumStock = item.minimumStock;
        await existingProd.save();

        let inv = await Inventory.findOne({ productId: prodId });
        if (!inv) {
          await Inventory.create({ productId: prodId, quantity: item.initialStock });
        }
      }
    }

    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    return NextResponse.json({
      success: true,
      message: "System populated with 100 top popular electronic products across 10 categories.",
      currency: "CFA",
      stats: {
        totalProducts,
        totalCategories,
      },
      accounts: [
        { username: "admin",   password: "admin123",   role: "Administrator" },
        { username: "manager", password: "manager123", role: "Inventory Manager" },
        { username: "cashier", password: "cashier123", role: "Cashier" },
      ],
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: error.message || "Failed to initialize database" }, { status: 500 });
  }
}
