"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatCFA } from "@/lib/format";
import { generateBarcodeSVG, generateQRCodeSVG } from "@/lib/barcode";
import {
  Printer, Search, Plus, Trash2, Sliders, Check, RefreshCw,
  Tag, QrCode, Sparkles, Copy, Eye, ZoomIn, ZoomOut, CheckCircle2,
  Package, LayoutGrid, Layers, ArrowRight
} from "lucide-react";

export interface LabelProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  stock: number;
}

interface QueuedItem {
  product: LabelProductItem;
  quantity: number;
}

type PresetFormat = "shelf_standard" | "shelf_compact" | "shelf_promo" | "warehouse_box" | "thermal_58" | "thermal_80" | "a4_sheet_24";
type BarcodeStyle = "code128" | "qr" | "both";
type PromoBadge = "NONE" | "BEST SELLER" | "SPECIAL PROMO" | "NEW ARRIVAL" | "100% ORIGINAL" | "WARRANTY INCLUDED";

const PRESETS: Record<PresetFormat, { name: string; desc: string; width: number; height: number; gridCols: number }> = {
  shelf_standard: { name: "Shelf Tag Standard", desc: "50mm × 30mm (Supermarkets & Tech)", width: 230, height: 135, gridCols: 3 },
  shelf_compact:  { name: "Compact Shelf Tag",   desc: "38mm × 25mm (Accessories & Cables)",  width: 190, height: 110, gridCols: 4 },
  shelf_promo:    { name: "Promotional Banner",  desc: "65mm × 40mm (High-impact sales)",      width: 270, height: 160, gridCols: 2 },
  warehouse_box:  { name: "Warehouse Carton",    desc: "100mm × 60mm (Storage & Pallets)",     width: 340, height: 200, gridCols: 2 },
  thermal_58:     { name: "58mm Thermal Roll",   desc: "Continuous 58mm POS Printer",         width: 210, height: 130, gridCols: 1 },
  thermal_80:     { name: "80mm Thermal Roll",   desc: "Continuous 80mm POS Printer",         width: 280, height: 150, gridCols: 1 },
  a4_sheet_24:    { name: "A4 Sticker Sheet",    desc: "24 Labels (3 cols × 8 rows on A4)",    width: 230, height: 135, gridCols: 3 },
};

export function LabelStudio({ products }: { products: LabelProductItem[] }) {
  const searchParams = useSearchParams();
  const initialSku = searchParams.get("sku")?.toUpperCase() ?? "";

  // Queue state
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Customization controls
  const [storeName, setStoreName] = useState("AIRFORCE COMPUTER");
  const [preset, setPreset] = useState<PresetFormat>("shelf_standard");
  const [barcodeStyle, setBarcodeStyle] = useState<BarcodeStyle>("code128");
  const [promoBadge, setPromoBadge] = useState<PromoBadge>("NONE");

  // Visibility Toggles
  const [showStoreName, setShowStoreName] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSkuText, setShowSkuText] = useState(true);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<"single" | "sheet">("single");

  // Automatically queue product if passed in URL query
  useEffect(() => {
    if (initialSku && products.length > 0) {
      const target = products.find((p) => p.sku.toUpperCase() === initialSku);
      if (target) {
        setQueue([{ product: target, quantity: 4 }]);
      }
    } else if (queue.length === 0 && products.length > 0) {
      // Default to first 2 products for an instant live demonstration
      setQueue([
        { product: products[0], quantity: 2 },
        ...(products[1] ? [{ product: products[1], quantity: 2 }] : []),
      ]);
    }
  }, [initialSku, products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  // Queue actions
  const addToQueue = (product: LabelProductItem, qty = 1) => {
    setQueue((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += qty;
        return copy;
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setQueue((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as QueuedItem[];
    });
  };

  const removeFromQueue = (productId: string) => {
    setQueue((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearQueue = () => setQueue([]);

  const addAllFiltered = () => {
    const newItems = filteredProducts.slice(0, 15).map((p) => ({
      product: p,
      quantity: 1,
    }));
    setQueue(newItems);
  };

  // Flattened labels list for the sheet print
  const flatLabels = useMemo(() => {
    const list: LabelProductItem[] = [];
    queue.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        list.push(item.product);
      }
    });
    return list;
  }, [queue]);

  const totalLabelCount = flatLabels.length;
  const currentFormat = PRESETS[preset];

  // Helper to render label content
  const renderLabelCard = (product: LabelProductItem, index = 0) => {
    const barcodeCode = product.barcode || product.sku;
    const barcodeSVG = generateBarcodeSVG({
      text: barcodeCode,
      height: preset === "shelf_compact" ? 34 : 44,
      moduleWidth: 1.6,
      includeText: showSkuText,
      color: "#000000",
    });

    const qrSVG = generateQRCodeSVG({
      data: `SKU:${product.sku}|PRICE:${product.sellingPrice}`,
      size: preset === "shelf_compact" ? 54 : 64,
      color: "#000000",
    });

    return (
      <div
        key={`${product.id}-${index}`}
        className="label-tag-card"
        style={{
          width: currentFormat.width,
          minHeight: currentFormat.height,
          border: "2px solid #0f172a",
          borderRadius: 6,
          background: "#ffffff",
          color: "#000000",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          position: "relative",
          pageBreakInside: "avoid",
          breakInside: "avoid",
        }}
      >
        {/* Header / Brand & Promo Ribbon */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          {showStoreName && (
            <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569" }}>
              {storeName}
            </div>
          )}
          {promoBadge !== "NONE" && (
            <span
              style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                background: "#000000",
                color: "#ffffff",
                padding: "1px 5px",
                borderRadius: 3,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {promoBadge}
            </span>
          )}
        </div>

        {/* Product Title */}
        <div
          style={{
            fontSize: preset === "shelf_compact" ? "0.78rem" : "0.9rem",
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#0f172a",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 2,
          }}
        >
          {product.name}
        </div>

        {/* Category & SKU Subtitle */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "#64748b", fontWeight: 600, marginBottom: 6 }}>
          {showCategory && <span>{product.category}</span>}
          {showSkuText && <span className="mono">SKU: {product.sku}</span>}
        </div>

        {/* Barcode & Price Block */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", justifyContent: "center" }}>
            {barcodeStyle === "code128" && (
              <div
                dangerouslySetInnerHTML={{ __html: barcodeSVG.svgContent }}
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
              />
            )}
            {barcodeStyle === "qr" && (
              <div
                dangerouslySetInnerHTML={{ __html: qrSVG }}
                style={{ display: "flex", justifyContent: "center" }}
              />
            )}
            {barcodeStyle === "both" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: barcodeSVG.svgContent }}
                  style={{ flex: 1, overflow: "hidden" }}
                />
                <div
                  dangerouslySetInnerHTML={{ __html: qrSVG }}
                  style={{ width: 44, height: 44, flexShrink: 0 }}
                />
              </div>
            )}
          </div>

          {/* Price Tag */}
          {showPrice && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#000000", lineHeight: 1 }}>
                {formatCFA(product.sellingPrice)}
              </div>
              <div style={{ fontSize: "0.52rem", fontWeight: 700, color: "#64748b", marginTop: 2 }}>
                TTC · NET
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const primaryProduct = queue.length > 0 ? queue[0].product : products[0];

  return (
    <div className="label-studio-container">
      {/* ── TOP CONTROL TOOLBAR (Hidden on print) ── */}
      <div className="card no-print" style={{ marginBottom: 16, padding: "12px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "var(--brand-100)", color: "var(--brand-700)", padding: 8, borderRadius: 8, display: "flex" }}>
            <Tag size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--gray-900)", fontSize: "1.05rem" }}>
              Label Print Studio
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--gray-500)" }}>
              {totalLabelCount} labels queued across {queue.length} product line(s)
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", background: "var(--gray-100)", borderRadius: 6, padding: "2px 6px" }}>
            <button
              onClick={() => setPreviewZoom((z) => Math.max(75, z - 25))}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--gray-600)" }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0 6px", color: "var(--gray-700)" }}>
              {previewZoom}%
            </span>
            <button
              onClick={() => setPreviewZoom((z) => Math.min(175, z + 25))}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--gray-600)" }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Direct Print Button */}
          <button
            onClick={() => window.print()}
            disabled={totalLabelCount === 0}
            className="btn btn-primary"
            style={{ padding: "8px 18px", fontWeight: 700, gap: 8 }}
          >
            <Printer size={16} />
            <span>Print {totalLabelCount} Label{totalLabelCount !== 1 ? "s" : ""}</span>
          </button>
        </div>
      </div>

      {/* ── 3-COLUMN WORKSPACE (Controls, Catalog, Live Preview) ── */}
      <div className="label-studio-grid no-print">
        {/* LEFT COLUMN: CUSTOMIZATION SETTINGS */}
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--gray-200)", paddingBottom: 10 }}>
            <Sliders size={16} color="var(--brand-600)" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>Label Settings</h3>
          </div>

          {/* Preset format selector */}
          <div>
            <label className="form-label">Label Dimensions Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetFormat)}
              className="form-input"
            >
              {Object.entries(PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.name} ({p.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Store Name Header */}
          <div>
            <label className="form-label">Store / Business Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="form-input"
              placeholder="e.g. AIRFORCE COMPUTER"
            />
          </div>

          {/* Barcode Technology */}
          <div>
            <label className="form-label">Barcode Symbology</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              <button
                type="button"
                onClick={() => setBarcodeStyle("code128")}
                className={`btn btn-sm ${barcodeStyle === "code128" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.72rem", padding: "6px 4px" }}
              >
                Code 128
              </button>
              <button
                type="button"
                onClick={() => setBarcodeStyle("qr")}
                className={`btn btn-sm ${barcodeStyle === "qr" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.72rem", padding: "6px 4px" }}
              >
                2D QR Code
              </button>
              <button
                type="button"
                onClick={() => setBarcodeStyle("both")}
                className={`btn btn-sm ${barcodeStyle === "both" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.72rem", padding: "6px 4px" }}
              >
                Dual Both
              </button>
            </div>
          </div>

          {/* Promotional Tag Ribbon */}
          <div>
            <label className="form-label">Promotional Ribbon</label>
            <select
              value={promoBadge}
              onChange={(e) => setPromoBadge(e.target.value as PromoBadge)}
              className="form-input"
            >
              <option value="NONE">None (Plain Label)</option>
              <option value="BEST SELLER">⭐ BEST SELLER</option>
              <option value="SPECIAL PROMO">🔥 SPECIAL PROMO</option>
              <option value="NEW ARRIVAL">✨ NEW ARRIVAL</option>
              <option value="100% ORIGINAL">🛡️ 100% ORIGINAL</option>
              <option value="WARRANTY INCLUDED">🏷️ WARRANTY INCLUDED</option>
            </select>
          </div>

          {/* Field Toggles */}
          <div>
            <label className="form-label">Elements Visibility</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.82rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                />
                <span>Store Header Title</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showCategory}
                  onChange={(e) => setShowCategory(e.target.checked)}
                />
                <span>Category Name</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                />
                <span>Selling Price (FCFA)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showSkuText}
                  onChange={(e) => setShowSkuText(e.target.checked)}
                />
                <span>SKU & Human-Readable Digits</span>
              </label>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: PRODUCT SELECTOR & BATCH QUEUE */}
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--gray-200)", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} color="var(--brand-600)" />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>Select Products</h3>
            </div>
            <button
              onClick={addAllFiltered}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.72rem" }}
            >
              + Queue First 15
            </button>
          </div>

          {/* Search & Category Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--gray-400)" }} />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, fontSize: "0.82rem" }}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
              {categories.slice(0, 7).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: selectedCategory === cat ? "var(--brand-600)" : "var(--gray-100)",
                    color: selectedCategory === cat ? "#fff" : "var(--gray-700)",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product list */}
          <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredProducts.slice(0, 40).map((prod) => {
              const inQueue = queue.find((q) => q.product.id === prod.id);
              return (
                <div
                  key={prod.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: inQueue ? "1px solid var(--brand-300)" : "1px solid var(--gray-100)",
                    background: inQueue ? "var(--brand-50)" : "var(--gray-50)",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontWeight: 700, color: "var(--gray-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--gray-500)" }}>
                      {prod.sku} · {formatCFA(prod.sellingPrice)}
                    </div>
                  </div>
                  <button
                    onClick={() => addToQueue(prod, 1)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                  >
                    <Plus size={12} /> {inQueue ? `+1 (${inQueue.quantity})` : "Add"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Print Queue Summary */}
          <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gray-800)" }}>
                Print Queue ({totalLabelCount} Stickers)
              </span>
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}
                >
                  Clear Queue
                </button>
              )}
            </div>

            <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {queue.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    background: "#ffffff",
                    borderRadius: 6,
                    border: "1px solid var(--gray-200)",
                    fontSize: "0.78rem",
                  }}
                >
                  <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                    {item.product.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid var(--gray-300)", background: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, minWidth: 16, textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid var(--gray-300)", background: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromQueue(item.product.id)}
                      style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", padding: 2 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--gray-200)", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Eye size={16} color="var(--brand-600)" />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>Interactive Preview</h3>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setActiveTab("single")}
                className={`btn btn-sm ${activeTab === "single" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.72rem", padding: "4px 8px" }}
              >
                Single Tag
              </button>
              <button
                onClick={() => setActiveTab("sheet")}
                className={`btn btn-sm ${activeTab === "sheet" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.72rem", padding: "4px 8px" }}
              >
                Full Sheet ({totalLabelCount})
              </button>
            </div>
          </div>

          {/* Visual Canvas Area */}
          <div
            style={{
              flex: 1,
              minHeight: 380,
              maxHeight: 520,
              overflowY: "auto",
              background: "var(--gray-100)",
              borderRadius: 8,
              padding: 20,
              display: "flex",
              justifyContent: "center",
              alignItems: activeTab === "single" ? "center" : "flex-start",
            }}
          >
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
              }}
            >
              {activeTab === "single" && primaryProduct && (
                <div>{renderLabelCard(primaryProduct, 0)}</div>
              )}

              {activeTab === "sheet" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${currentFormat.gridCols}, minmax(0, 1fr))`,
                    gap: 12,
                    background: "#ffffff",
                    padding: 16,
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                >
                  {flatLabels.map((prod, i) => renderLabelCard(prod, i))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PRINT-ONLY OUTPUT CONTAINER (Rendered exclusively when window.print() is called) ── */}
      <div id="print-labels-target" className="print-only">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${currentFormat.gridCols}, minmax(0, 1fr))`,
            gap: "8mm",
            padding: "8mm",
            background: "#ffffff",
          }}
        >
          {flatLabels.map((prod, i) => renderLabelCard(prod, i))}
        </div>
      </div>

      <style jsx global>{`
        .label-studio-grid {
          display: grid;
          grid-template-columns: 280px 340px 1fr;
          gap: 16px;
          align-items: stretch;
        }

        @media (max-width: 1200px) {
          .label-studio-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Pure Print Optimization */
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @media print {
          /* Hide all application shells */
          .no-print,
          .app-header,
          .app-footer,
          .dashboard-sidebar,
          .page-header {
            display: none !important;
          }

          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-only {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
          }

          .label-tag-card {
            box-shadow: none !important;
            border: 1.5px solid #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
