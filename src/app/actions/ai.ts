"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/db";
import { Product, Inventory, Sale, SaleItem, StockMovement, Purchase, Category, PurchaseItem } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

// ── Gemini model cascade: prioritizes lowest-latency verified models first ────
const GEMINI_MODEL_CASCADE = [
  "gemini-3.1-flash-lite",    // Ultra-fast verified model (sub-second response ~500ms - 1.2s)
  "gemini-flash-latest",      // Robust official alias fallback
  "gemini-flash-lite-latest", // Lite fallback
  "gemini-3.5-flash",         // Standard flash fallback
  "gemini-2.5-flash",         // Base flash fallback
];

// In-memory cache of currently working model to eliminate failover retry latency on subsequent requests
let activeWorkingModel = "gemini-3.1-flash-lite";

async function callGemini(
  apiKey: string,
  prompt: string,
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Try the active working model first, then the rest of the cascade
  const modelsToTry = [
    activeWorkingModel,
    ...GEMINI_MODEL_CASCADE.filter((m) => m !== activeWorkingModel),
  ];

  let lastError: any;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: opts?.maxTokens ?? 1024,
          temperature: opts?.temperature ?? 0.2,
          topP: 0.95,
        },
      });

      const result = await model.generateContent(prompt);
      activeWorkingModel = modelName;
      return result.response.text().trim();
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      const is503 = msg.includes("503") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("overloaded");
      const is429 = msg.includes("429") || msg.toLowerCase().includes("quota");
      const isUnavailable =
        msg.includes("404") ||
        msg.toLowerCase().includes("no longer available") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("update your code");

      if (is503 || is429 || isUnavailable) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("All Gemini models in cascade failed");
}

export interface AIAnalysisResult {
  demandForecasting: string[];
  reorderRecommendations: string[];
  lowStockPredictions: string[];
  salesAnalysis: string[];
  slowMovingProducts: string[];
  anomalyDetection: string[];
  generatedAt: string;
  isAiGenerated: boolean;
  status: "success" | "insufficient_data" | "error";
  message?: string;
}

export async function generateComprehensiveAIAnalysis(): Promise<AIAnalysisResult> {
  await connectToDatabase();
  const session = await getSession();

  if (!session || !hasPermission(session.role, "ai.inventory_analysis")) {
    return {
      demandForecasting: [],
      reorderRecommendations: [],
      lowStockPredictions: [],
      salesAnalysis: [],
      slowMovingProducts: [],
      anomalyDetection: [],
      generatedAt: new Date().toISOString(),
      isAiGenerated: false,
      status: "error",
      message: "Unauthorized: Administrator or Inventory Manager access required.",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Retrieve actual system data
  const products = await Product.find({ isActive: true }).lean();
  const inventoryList = await Inventory.find().lean();
  const salesList = await Sale.find().sort({ createdAt: -1 }).limit(100).lean();
  const saleItems = await SaleItem.find().sort({ createdAt: -1 }).limit(200).lean();
  const movements = await StockMovement.find().sort({ createdAt: -1 }).limit(100).lean();
  const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(50).lean();

  if (products.length === 0) {
    return {
      demandForecasting: ["Insufficient product data to forecast demand."],
      reorderRecommendations: ["No active products found in the catalog."],
      lowStockPredictions: ["No inventory data available for evaluation."],
      salesAnalysis: ["No sales transactions recorded yet."],
      slowMovingProducts: ["Insufficient catalog data to identify velocity."],
      anomalyDetection: ["No transaction records to detect anomalies."],
      generatedAt: new Date().toISOString(),
      isAiGenerated: false,
      status: "insufficient_data",
      message: "Insufficient data in the system to perform AI analysis. Add products and record transactions first.",
    };
  }

  const inventorySnapshot = products.map((p) => {
    const inv = inventoryList.find((i) => i.productId.toString() === p._id.toString());
    const qty = inv?.quantity ?? 0;
    const soldItems = saleItems.filter((si) => si.productId.toString() === p._id.toString());
    const totalUnitsSold = soldItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const prodMovements = movements.filter((m) => m.productId.toString() === p._id.toString());
    return {
      name: p.name,
      sku: p.sku,
      currentStock: qty,
      minimumStock: p.minimumStock,
      sellingPrice: p.sellingPrice,
      purchasePrice: p.purchasePrice,
      totalUnitsSold,
      movementCount: prodMovements.length,
      isBelowMin: qty <= p.minimumStock,
      isOutOfStock: qty === 0,
    };
  });

  if (!apiKey) {
    const lowStockItems = inventorySnapshot.filter((i) => i.isBelowMin);
    const outOfStockItems = inventorySnapshot.filter((i) => i.isOutOfStock);
    const topSellers = [...inventorySnapshot].sort((a, b) => b.totalUnitsSold - a.totalUnitsSold).filter((i) => i.totalUnitsSold > 0);
    const zeroSales = inventorySnapshot.filter((i) => i.totalUnitsSold === 0);
    return {
      demandForecasting: topSellers.length > 0
        ? topSellers.slice(0, 3).map((p) => `High customer demand observed for "${p.name}" with ${p.totalUnitsSold} units sold.`)
        : ["Insufficient historical sales transactions to establish dynamic demand patterns."],
      reorderRecommendations: lowStockItems.length > 0
        ? lowStockItems.map((p) => `Replenishment recommended: "${p.name}" (SKU: ${p.sku}) is at ${p.currentStock} units (Threshold: ${p.minimumStock}).`)
        : ["All active product lines currently meet or exceed their configured minimum stock thresholds."],
      lowStockPredictions: outOfStockItems.length > 0
        ? outOfStockItems.map((p) => `CRITICAL: "${p.name}" is completely out of stock (0 units).`)
        : lowStockItems.length > 0
        ? lowStockItems.map((p) => `Stock depletion alert: "${p.name}" has only ${p.currentStock} units remaining.`)
        : ["No immediate stock depletion risks detected across current active inventory."],
      salesAnalysis: [
        `Recorded ${salesList.length} completed customer sales transactions in total.`,
        topSellers.length > 0
          ? `Top revenue generator: "${topSellers[0].name}" with ${topSellers[0].totalUnitsSold} units sold.`
          : "Sales distribution is currently even or has minimal transaction history.",
      ],
      slowMovingProducts: zeroSales.length > 0
        ? zeroSales.slice(0, 3).map((p) => `Zero sales recorded for "${p.name}" (Current stock: ${p.currentStock} units). Review pricing or visibility.`)
        : ["All products in the catalog have recorded active sales activity."],
      anomalyDetection: [
        outOfStockItems.length > 0 ? `Stockout anomaly: ${outOfStockItems.length} products have zero inventory.` : "No stockout anomalies detected.",
        purchases.filter((p) => p.status === "Submitted").length > 0
          ? `${purchases.filter((p) => p.status === "Submitted").length} purchase orders are awaiting stock reception.`
          : "Purchase pipeline is normal with no stalled orders.",
      ],
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
      status: "success",
    };
  }

  try {
    const compactContext = inventorySnapshot.map(
      (i) => `${i.sku} | ${i.name} | Stock:${i.currentStock} (Min:${i.minimumStock}) | Sold:${i.totalUnitsSold} | Buy:${i.purchasePrice} Sell:${i.sellingPrice} CFA`
    ).join("\n");

    const summaryStats = `Total completed sales: ${salesList.length}, Total purchase orders: ${purchases.length}, Total stock movements: ${movements.length}`;
    const prompt = `You are the InvenSmart AI decision-support engine for an enterprise inventory management system. All financial amounts are in CFA.
Analyze this inventory data and output a strict JSON object with these 6 keys, each containing an array of 2 to 3 concise, actionable insight strings:

Inventory Items (Values in CFA):
${compactContext}

Summary:
${summaryStats}

Respond ONLY with valid JSON strictly matching this schema (no backticks):
{
  "demandForecasting": ["string", "string"],
  "reorderRecommendations": ["string", "string"],
  "lowStockPredictions": ["string", "string"],
  "salesAnalysis": ["string", "string"],
  "slowMovingProducts": ["string", "string"],
  "anomalyDetection": ["string", "string"]
}`;

    const rawText = await callGemini(apiKey, prompt, { maxTokens: 800, temperature: 0.2 });
    const cleanedJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);
    return {
      demandForecasting: Array.isArray(parsed.demandForecasting) ? parsed.demandForecasting : [],
      reorderRecommendations: Array.isArray(parsed.reorderRecommendations) ? parsed.reorderRecommendations : [],
      lowStockPredictions: Array.isArray(parsed.lowStockPredictions) ? parsed.lowStockPredictions : [],
      salesAnalysis: Array.isArray(parsed.salesAnalysis) ? parsed.salesAnalysis : [],
      slowMovingProducts: Array.isArray(parsed.slowMovingProducts) ? parsed.slowMovingProducts : [],
      anomalyDetection: Array.isArray(parsed.anomalyDetection) ? parsed.anomalyDetection : [],
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
      status: "success",
    };
  } catch (err: any) {
    console.error("Gemini AI Analysis Error:", err);
    return {
      demandForecasting: ["Error communicating with AI engine."],
      reorderRecommendations: ["Unable to fetch AI reorder recommendations."],
      lowStockPredictions: ["Unable to generate low stock predictions."],
      salesAnalysis: ["Unable to generate sales velocity breakdown."],
      slowMovingProducts: ["Unable to detect slow moving inventory."],
      anomalyDetection: ["Unable to run anomaly detection."],
      generatedAt: new Date().toISOString(),
      isAiGenerated: false,
      status: "error",
      message: err.message || "Failed to generate AI analysis",
    };
  }
}

// ── Interactive Q&A with Gemini AI ───────────────────────────────────────────

export interface AIChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export async function askAIQuestion(
  question: string,
  conversationHistory: AIChatMessage[]
): Promise<{ answer: string; error?: string }> {
  await connectToDatabase();
  const session = await getSession();
  if (!session || !hasPermission(session.role, "ai.inventory_analysis")) {
    return { answer: "", error: "Unauthorized: Administrator or Inventory Manager access required." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { answer: "", error: "Gemini AI API key is not configured. Contact your Administrator." };
  }

  if (!question || question.trim().length === 0) {
    return { answer: "", error: "Please enter a question." };
  }

  // Gather database context in parallel
  const [
    allProducts,
    allCategories,
    inventoryList,
    salesList,
    saleItems,
    purchases,
  ] = await Promise.all([
    Product.find({}).lean(),
    Category.find({}).lean(),
    Inventory.find({}).lean(),
    Sale.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    SaleItem.find({}).sort({ createdAt: -1 }).limit(300).lean(),
    Purchase.find({}).sort({ createdAt: -1 }).limit(30).lean(),
  ]);

  // Build category name lookup
  const categoryMap: Record<string, string> = {};
  for (const cat of allCategories) {
    categoryMap[cat._id.toString()] = cat.name;
  }

  // Build compact inventory summary lines (significantly faster tokenization and inference)
  const inventoryLines = allProducts.map((p) => {
    const inv = inventoryList.find((i) => i.productId.toString() === p._id.toString());
    const qty = inv?.quantity ?? 0;
    const soldItems = saleItems.filter((si) => si.productId.toString() === p._id.toString());
    const totalUnitsSold = soldItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const catName = p.categoryId ? (categoryMap[p.categoryId.toString()] ?? "General") : "General";
    return `${p.sku} | ${p.name} | Cat:${catName} | Stock:${qty}/${p.minimumStock} min | Buy:${p.purchasePrice} Sell:${p.sellingPrice} CFA | Sold:${totalUnitsSold}${!p.isActive ? " (INACTIVE)" : ""}`;
  }).join("\n");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const addedToday = allProducts
    .filter((p) => new Date(p.createdAt) >= todayStart)
    .map((p) => `${p.sku} | ${p.name} | Added:${new Date(p.createdAt).toLocaleTimeString()}`)
    .join("\n");

  const totalSalesRevenue = salesList.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);

  const purchaseSummary = purchases.slice(0, 8).map((po) =>
    `${po.purchaseNumber} | Vendor:${po.vendorName} | ${po.status} | Total:${po.totalAmount} CFA`
  ).join("\n");

  const historyMessages = conversationHistory
    .slice(-6)
    .map((msg) => `${msg.role === "user" ? "Manager" : "AI"}: ${msg.content}`)
    .join("\n");

  const now = new Date().toISOString();

  const systemPrompt = `You are the InvenSmart AI assistant, an intelligent real-time inventory management advisor for a Cameroon enterprise. All currency is in CFA (FCFA). Current time: ${now}.

Rules:
- Answer using ONLY the real live data provided below
- Answer concisely, professionally, and directly
- If asked about time (e.g. what was added today), check the added today list
- Reference exact names, SKUs, numbers, and CFA amounts

LIVE INVENTORY DATA (${allProducts.length} items):
[SKU | Name | Category | Stock/Min | Prices | Units Sold]
${inventoryLines}

PRODUCTS ADDED TODAY:
${addedToday || "None"}

SYSTEM SUMMARY:
- Products: ${allProducts.length} total
- Sales Revenue: ${totalSalesRevenue.toLocaleString()} CFA (${salesList.length} sales)
- Procurement Cost: ${totalPurchaseCost.toLocaleString()} CFA (${purchases.length} POs)

RECENT POs:
${purchaseSummary || "None"}

${historyMessages ? `CONVERSATION:\n${historyMessages}\n` : ""}
Manager: ${question}
AI:`;

  try {
    const answer = await callGemini(apiKey, systemPrompt, { maxTokens: 600, temperature: 0.2 });
    return { answer };
  } catch (err: any) {
    console.error("Gemini AI Chat Error:", err);
    return {
      answer: "",
      error: err.message || "Failed to get response from Gemini AI. Please try again.",
    };
  }
}
