"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/db";
import { Product, Inventory, Sale, SaleItem, StockMovement, Purchase } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

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

  // Pre-calculate statistical baseline from real database records
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

  // If no Gemini API key is configured, provide accurate deterministic statistical intelligence
  if (!apiKey) {
    const lowStockItems = inventorySnapshot.filter((i) => i.isBelowMin);
    const outOfStockItems = inventorySnapshot.filter((i) => i.isOutOfStock);
    const topSellers = [...inventorySnapshot].sort((a, b) => b.totalUnitsSold - a.totalUnitsSold).filter((i) => i.totalUnitsSold > 0);
    const zeroSales = inventorySnapshot.filter((i) => i.totalUnitsSold === 0);

    return {
      demandForecasting: topSellers.length > 0
        ? topSellers.slice(0, 3).map((p) => `High customer demand observed for "${p.name}" with ${p.totalUnitsSold} units sold. Anticipate continued velocity.`)
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

  // LLM AI Generation via Google Gemini
  try {
    const dataContext = JSON.stringify(inventorySnapshot, null, 2);
    const summaryStats = `Total completed sales: ${salesList.length}, Total purchase orders: ${purchases.length}, Total stock movements logged: ${movements.length}`;

    const prompt = `You are the InvenSmart AI decision-support engine for an enterprise inventory management system. All financial amounts and prices are in CFA.
Analyze the following REAL inventory dataset and output your findings as a strict JSON object with exactly these 6 keys, each containing an array of 2 to 4 concise, actionable insight strings:

Dataset (Values in CFA):
${dataContext}
Summary:
${summaryStats}

Respond ONLY with a valid JSON object strictly matching this schema (do NOT wrap with backticks or other text):
{
  "demandForecasting": ["string", "string"],
  "reorderRecommendations": ["string", "string"],
  "lowStockPredictions": ["string", "string"],
  "salesAnalysis": ["string", "string"],
  "slowMovingProducts": ["string", "string"],
  "anomalyDetection": ["string", "string"]
}

Important Rules:
- All monetary values must be referenced in CFA.
- Base every single insight purely on the provided real data.
- If there is insufficient data for any category, write a clear string stating "Insufficient historical transaction data to determine...". Do NOT invent fake figures.
- Keep bullet points professional, analytical, and actionable for an Inventory Manager.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (modelErr) {
      model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      result = await model.generateContent(prompt);
    }
    const rawText = result.response.text().trim();

    // Clean JSON if model output includes markdown code blocks
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

// ─── Interactive Q&A with Gemini AI ─────────────────────────────────────────

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

  // Gather real inventory context
  const products = await Product.find({ isActive: true }).lean();
  const inventoryList = await Inventory.find().lean();
  const salesList = await Sale.find().sort({ createdAt: -1 }).limit(80).lean();
  const saleItems = await SaleItem.find().sort({ createdAt: -1 }).limit(150).lean();
  const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(40).lean();

  const inventoryContext = products.map((p) => {
    const inv = inventoryList.find((i) => i.productId.toString() === p._id.toString());
    const qty = inv?.quantity ?? 0;
    const soldItems = saleItems.filter((si) => si.productId.toString() === p._id.toString());
    const totalUnitsSold = soldItems.reduce((acc, curr) => acc + curr.quantity, 0);
    return {
      name: p.name,
      sku: p.sku,
      currentStock: qty,
      minimumStock: p.minimumStock,
      sellingPrice: p.sellingPrice,
      purchasePrice: p.purchasePrice,
      totalUnitsSold,
      isBelowMin: qty <= p.minimumStock,
      isOutOfStock: qty === 0,
    };
  });

  const totalSalesRevenue = salesList.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);

  // Build conversation context
  const historyMessages = conversationHistory
    .slice(-8) // Keep last 8 messages for context window
    .map((msg) => `${msg.role === "user" ? "Manager" : "AI"}: ${msg.content}`)
    .join("\n");

  const systemPrompt = `You are the InvenSmart AI assistant, an intelligent inventory management advisor for a Cameroon-based enterprise. All monetary values are in CFA (FCFA).

Your role:
- Answer inventory, procurement, sales, stock, and business questions using the REAL data provided below
- Provide actionable, professional, and concise answers
- Reference specific product names, SKUs, quantities, and CFA amounts from the data
- If the question is outside your inventory data scope, politely say so
- NEVER invent data that isn't in the dataset
- Format your responses clearly with bullet points or numbered lists when appropriate
- Keep responses concise but thorough (2-6 sentences typical, more for complex questions)

LIVE INVENTORY DATA:
${JSON.stringify(inventoryContext, null, 1)}

SUMMARY STATS:
- Total active products: ${products.length}
- Total sales recorded: ${salesList.length}
- Total revenue: ${totalSalesRevenue.toLocaleString()} CFA
- Total purchase orders: ${purchases.length}
- Total procurement cost: ${totalPurchaseCost.toLocaleString()} CFA
- Gross margin: ${(totalSalesRevenue - totalPurchaseCost).toLocaleString()} CFA
- Low stock items: ${inventoryContext.filter((i) => i.isBelowMin).length}
- Out of stock items: ${inventoryContext.filter((i) => i.isOutOfStock).length}

${historyMessages ? `CONVERSATION HISTORY:\n${historyMessages}\n` : ""}
Manager's Question: ${question}

Respond directly and professionally as the InvenSmart AI assistant. Do NOT wrap your response in JSON or code blocks.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    let result;
    try {
      result = await model.generateContent(systemPrompt);
    } catch (modelErr) {
      model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      result = await model.generateContent(systemPrompt);
    }
    const answer = result.response.text().trim();

    return { answer };
  } catch (err: any) {
    console.error("Gemini AI Chat Error:", err);
    return {
      answer: "",
      error: err.message || "Failed to get response from Gemini AI. Please try again.",
    };
  }
}
