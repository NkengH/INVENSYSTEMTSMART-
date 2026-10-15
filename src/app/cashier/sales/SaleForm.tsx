"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { processSale } from "@/app/actions/sales";
import { formatCFA } from "@/lib/format";
import { sounds } from "@/lib/sound";
import {
  ShoppingCart, CheckCircle, CreditCard, Trash2, Plus, Minus,
  Search, Package, DollarSign, ArrowRight, X, Sparkles, Receipt,
  PauseCircle, PlayCircle, Smartphone, Building2, User, Phone,
  Percent, Printer, Check, Volume2, VolumeX,
  Monitor, HardDrive, Keyboard, Mouse, Camera, Laptop, Headphones, Cpu, Plug, Tablet
} from "lucide-react";

interface CartItem {
  product: any;
  quantity: number;
}

interface HeldOrder {
  id: string;
  timestamp: string;
  cart: CartItem[];
  customerName?: string;
  total: number;
}

const CFA_NOTES = [2000, 5000, 10000, 20000, 50000, 100000];

export function SaleForm({ products }: { products: any[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MTN_MOMO" | "ORANGE_MONEY" | "BANK_TRANSFER">("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return ["ALL", ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === "ALL" || p.categoryName === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * parseFloat(item.product.sellingPrice), 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const numericCashTendered = parseFloat(cashTendered) || 0;
  const changeAmount = paymentMethod === "CASH" && numericCashTendered > total ? numericCashTendered - total : 0;
  const hasInsufficientTender = paymentMethod === "CASH" && cashTendered !== "" && numericCashTendered < total;

  const [scanQty, setScanQty] = useState<number>(1);

  // Global hardware barcode scanner listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;

    function handleGlobalKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") &&
        target !== searchInputRef.current
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 80) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= 2) {
          e.preventDefault();
          const code = buffer.trim().toLowerCase();
          buffer = "";

          const matched = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === code) ||
              p.sku.toLowerCase() === code ||
              p.name.toLowerCase() === code
          );

          if (matched) {
            addToCart(matched, matched.barcode ? `${matched.barcode} - ${matched.name}` : matched.name, scanQty);
          } else {
            setSearchQuery(code);
            setError(`No product found matching barcode "${code}"`);
            if (soundEnabled) sounds.playWarningBuzz();
          }
        }
        buffer = "";
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products, soundEnabled, cart, scanQty]);

  function addToCart(product: any, displayOverride?: string, customQty?: number) {
    setError(null);
    if (product.stock <= 0) {
      if (soundEnabled) sounds.playWarningBuzz();
      setError(`"${product.name}" is out of stock.`);
      return;
    }

    if (soundEnabled) sounds.playScanBeep();

    const addAmount = Math.max(1, customQty || scanQty || 1);
    const existing = cart.find((c) => c.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const requestedQty = currentQty + addAmount;

    if (requestedQty > product.stock) {
      if (soundEnabled) sounds.playWarningBuzz();
      setError(`Cannot add ${addAmount} units. Only ${product.stock - currentQty} available in stock.`);
      return;
    }

    if (existing) {
      setCart(cart.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + addAmount } : c)));
    } else {
      setCart([...cart, { product, quantity: addAmount }]);
    }

    // Set search box value to scanned product barcode / name so it appears in the scan barcode search box
    const scannedText = displayOverride || (product.barcode ? `${product.barcode} - ${product.name}` : product.name);
    setSearchQuery(scannedText);

    // Focus and select the text in search input so subsequent scan overwrites automatically
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    }, 50);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        const matched = filteredProducts[0];
        addToCart(matched, searchQuery || (matched.barcode ? `${matched.barcode} - ${matched.name}` : matched.name), scanQty);
      } else if (searchQuery.trim()) {
        if (soundEnabled) sounds.playWarningBuzz();
        setError(`No product found matching barcode or query "${searchQuery}"`);
      }
    }
  }

  function updateQuantity(productId: string, newQty: number, maxStock: number) {
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.product.id !== productId));
    } else if (newQty > maxStock) {
      if (soundEnabled) sounds.playWarningBuzz();
      setError(`Cannot exceed available stock of ${maxStock} units.`);
    } else {
      setError(null);
      setCart(cart.map((c) => (c.product.id === productId ? { ...c, quantity: newQty } : c)));
    }
  }

  function handleHoldOrder() {
    if (cart.length === 0) return;
    const newHeldOrder: HeldOrder = {
      id: "HOLD-" + Date.now().toString().slice(-4),
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      cart: [...cart],
      customerName: customerName || undefined,
      total,
    };
    setHeldOrders([newHeldOrder, ...heldOrders]);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountPercent(0);
    setCashTendered("");
  }

  function handleRecallOrder(orderId: string) {
    const order = heldOrders.find((h) => h.id === orderId);
    if (!order) return;
    setCart(order.cart);
    setCustomerName(order.customerName || "");
    setHeldOrders(heldOrders.filter((h) => h.id !== orderId));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (paymentMethod === "CASH" && numericCashTendered > 0 && numericCashTendered < total) {
      if (soundEnabled) sounds.playWarningBuzz();
      setError(`Cash tendered (${formatCFA(numericCashTendered)}) is less than total amount (${formatCFA(total)}).`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const items = cart.map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
        unitPrice: parseFloat(c.product.sellingPrice),
      }));

      const res = await processSale({
        items,
        paymentMethod,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        discountAmount,
        cashTendered: paymentMethod === "CASH" && numericCashTendered ? numericCashTendered : total,
        changeAmount,
      });

      if (soundEnabled) sounds.playSaleSuccess();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inventory:change"));
      }

      setLastCompletedSale({
        saleNumber: res.saleNumber,
        receiptNumber: res.receiptNumber,
        items: [...cart],
        subtotal,
        discountAmount,
        total,
        cashTendered: numericCashTendered || total,
        changeAmount,
        paymentMethod,
        customerName,
        customerPhone,
        date: new Date().toISOString(),
      });

      // Clear current transaction state
      setCart([]);
      setCashTendered("");
      setCustomerName("");
      setCustomerPhone("");
      setDiscountPercent(0);
    } catch (err: any) {
      if (soundEnabled) sounds.playWarningBuzz();
      setError(err.message || "Failed to process sale. Please check till status and stock availability.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20, alignItems: "start" }}>
      {/* LEFT COLUMN: Category Browser + Product Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Search Bar & Scanner */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={17} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedCategory("ALL");
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or search product name..."
                className="form-input"
                style={{ paddingLeft: 38, margin: 0, fontSize: "0.88rem" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)" }}>
                  <X size={15} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--gray-100)", padding: "2px 8px", borderRadius: 8, border: "1px solid var(--gray-200)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-600)" }}>Qty:</span>
              <input
                type="number"
                min="1"
                value={scanQty}
                onChange={(e) => setScanQty(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 44, border: "none", background: "transparent", fontSize: "0.88rem", fontWeight: 800, color: "var(--brand-700)", textAlign: "center", outline: "none" }}
                title="Quantity to add when scanning or clicking a product"
              />
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-sm"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
              style={{ padding: "8px 10px" }}
            >
              {soundEnabled ? <Volume2 size={16} style={{ color: "var(--brand-600)" }} /> : <VolumeX size={16} style={{ color: "var(--gray-400)" }} />}
            </button>
          </div>
        </div>

        {/* CATEGORY CARDS VIEW — shown when no search and no specific category selected */}
        {!searchQuery && selectedCategory === "ALL" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 2 }}>
              Browse by Category
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {categories.filter(c => c !== "ALL").map((cat, idx) => {
                const catProducts = products.filter(p => p.categoryName === cat);
                const inStockCount = catProducts.filter(p => p.stock > 0).length;
                const palette = [
                  { bg: "linear-gradient(135deg, #6366f1, #818cf8)", icon: <Monitor size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #0ea5e9, #38bdf8)", icon: <Smartphone size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #10b981, #34d399)", icon: <Printer size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #f59e0b, #fbbf24)", icon: <Plug size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #ef4444, #f87171)", icon: <HardDrive size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #8b5cf6, #a78bfa)", icon: <Keyboard size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #ec4899, #f472b6)", icon: <Mouse size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #14b8a6, #2dd4bf)", icon: <Camera size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #f97316, #fb923c)", icon: <Laptop size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #06b6d4, #22d3ee)", icon: <Headphones size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #84cc16, #a3e635)", icon: <Cpu size={28} color="#fff" /> },
                  { bg: "linear-gradient(135deg, #64748b, #94a3b8)", icon: <Package size={28} color="#fff" /> },
                ];
                const p = palette[idx % palette.length];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: p.bg,
                      border: "none",
                      borderRadius: 12,
                      padding: "18px 16px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                      transition: "all 0.18s ease",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px) scale(1.02)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0) scale(1)")}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", flexShrink: 0 }}>
                      {p.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#fff", lineHeight: 1.2 }}>{cat}</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", marginTop: 3 }}>
                        {catProducts.length} products · {inStockCount} in stock
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PRODUCT GRID VIEW — shown when a category is selected OR search is active */}
        {(selectedCategory !== "ALL" || searchQuery) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Header with back button */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => { setSelectedCategory("ALL"); setSearchQuery(""); }}
                style={{ background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", color: "var(--gray-700)", display: "flex", alignItems: "center", gap: 4 }}
              >
                ← Back
              </button>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gray-800)" }}>
                {searchQuery ? `Search: "${searchQuery}"` : selectedCategory}
                <span style={{ fontWeight: 400, color: "var(--gray-400)", marginLeft: 6 }}>({filteredProducts.length} items)</span>
              </span>
            </div>

            {/* Products */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
              {filteredProducts.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--gray-400)", background: "var(--bg-card)", borderRadius: 12, border: "1px dashed var(--gray-200)" }}>
                  <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>No products found</div>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const inStock = p.stock > 0;
                  const cartItem = cart.find((c) => c.product.id === p.id);
                  const currentQty = cartItem?.quantity || 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      style={{
                        background: inStock ? "var(--bg-card)" : "var(--gray-50)",
                        border: currentQty > 0 ? "2px solid var(--brand-500)" : "1px solid var(--gray-200)",
                        borderRadius: 10,
                        padding: 12,
                        cursor: inStock ? "pointer" : "not-allowed",
                        opacity: inStock ? 1 : 0.6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        transition: "all 0.15s ease",
                        boxShadow: currentQty > 0 ? "0 2px 8px rgba(99, 102, 241, 0.15)" : "none",
                        minHeight: 100,
                      }}
                    >
                      {currentQty > 0 && (
                        <div style={{ position: "absolute", top: 7, right: 7, background: "var(--brand-600)", color: "#fff", width: 20, height: 20, borderRadius: "50%", fontSize: "0.68rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {currentQty}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", fontWeight: 600, textTransform: "uppercase" }}>{p.sku}</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gray-900)", marginTop: 2, lineHeight: 1.3 }}>{p.name}</div>
                      </div>
                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--brand-700)" }}>{formatCFA(p.sellingPrice)}</div>
                          <div style={{ fontSize: "0.65rem", color: inStock ? (p.stock < 5 ? "var(--warning)" : "var(--success)") : "var(--danger)", fontWeight: 600 }}>
                            {inStock ? `${p.stock} left` : "Out of stock"}
                          </div>
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-50)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={13} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Held Orders List */}
        {heldOrders.length > 0 && (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: "var(--gray-800)", marginBottom: 8 }}>
              <PauseCircle size={15} style={{ color: "var(--warning)" }} /> Held Transactions ({heldOrders.length})
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              {heldOrders.map((h) => (
                <div
                  key={h.id}
                  style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, fontSize: "0.78rem", flexShrink: 0 }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{h.id} • {h.total ? formatCFA(h.total) : ""}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--gray-500)" }}>{h.customerName ? `Client: ${h.customerName} • ` : ""}{h.timestamp}</div>
                  </div>
                  <button onClick={() => handleRecallOrder(h.id)} className="btn btn-primary btn-sm" style={{ padding: "4px 8px", fontSize: "0.72rem" }}>
                    <PlayCircle size={12} /> Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Active Cart, Tender & Checkout */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 24,
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
        }}
      >
        {/* Cart Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, color: "var(--gray-900)", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={18} /> Current Order Cart
              <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>{totalItemsCount} items</span>
            </div>
          </div>
          {cart.length > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleHoldOrder} className="btn btn-secondary btn-sm" title="Hold this transaction">
                <PauseCircle size={13} /> Hold
              </button>
              <button onClick={() => setCart([])} className="btn btn-secondary btn-sm" title="Clear cart" style={{ color: "var(--danger)" }}>
                <Trash2 size={13} /> Clear
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="form-error" style={{ margin: "12px 20px 0" }}>
            {error}
          </div>
        )}

        {/* Cart Items List */}
        <div style={{ flex: 1, minHeight: 120, maxHeight: 320, overflowY: "auto", padding: "12px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 10px", color: "var(--gray-400)" }}>
              <ShoppingCart size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Your cart is empty</div>
              <div style={{ fontSize: "0.74rem" }}>Select items or scan barcode to begin sale</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cart.map((item) => {
                const itemTotal = item.quantity * parseFloat(item.product.sellingPrice);
                return (
                  <div
                    key={item.product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: "var(--gray-50)",
                      borderRadius: 8,
                      border: "1px solid var(--gray-200)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--gray-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--gray-500)" }}>
                        {formatCFA(item.product.sellingPrice)} each
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* Qty Controls */}
                      <div style={{ display: "flex", alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--gray-300)", borderRadius: 6 }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.stock)}
                          style={{ padding: "4px 6px", border: "none", background: "none", cursor: "pointer" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.stock)}
                          style={{ padding: "4px 6px", border: "none", background: "none", cursor: "pointer" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div style={{ minWidth: 80, textAlign: "right", fontWeight: 700, fontSize: "0.85rem", color: "var(--gray-900)" }}>
                        {formatCFA(itemTotal)}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => updateQuantity(item.product.id, 0, item.product.stock)}
                        style={{ border: "none", background: "none", color: "var(--gray-400)", cursor: "pointer", padding: 4 }}
                        title="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer & Discount Fields (Collapsible/Optional) */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gray-200)", background: "var(--bg-card)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 2 }}>
                Client Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input"
                style={{ padding: "6px 10px", fontSize: "0.78rem", margin: 0 }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 2 }}>
                Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 699 00 00 00"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-input"
                style={{ padding: "6px 10px", fontSize: "0.78rem", margin: 0 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--gray-600)" }}>Discount (%):</span>
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setDiscountPercent(pct)}
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  background: discountPercent === pct ? "var(--brand-600)" : "var(--gray-100)",
                  color: discountPercent === pct ? "#fff" : "var(--gray-700)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {pct === 0 ? "None" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gray-200)", background: "var(--gray-50)" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gray-700)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Payment Method
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              style={{
                padding: "8px 6px",
                borderRadius: 6,
                border: paymentMethod === "CASH" ? "2px solid var(--brand-600)" : "1px solid var(--gray-200)",
                background: paymentMethod === "CASH" ? "var(--brand-50)" : "var(--bg-card)",
                color: paymentMethod === "CASH" ? "var(--brand-700)" : "var(--gray-700)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <DollarSign size={15} />
              <span style={{ textAlign: "center", lineHeight: 1.2 }}>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("MTN_MOMO")}
              style={{
                padding: "8px 6px",
                borderRadius: 6,
                border: paymentMethod === "MTN_MOMO" ? "2px solid #eab308" : "1px solid var(--gray-200)",
                background: paymentMethod === "MTN_MOMO" ? "rgba(234, 179, 8, 0.15)" : "var(--bg-card)",
                color: paymentMethod === "MTN_MOMO" ? "#a16207" : "var(--gray-700)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Smartphone size={15} />
              <span style={{ textAlign: "center", lineHeight: 1.2 }}>MTN MoMo</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("ORANGE_MONEY")}
              style={{
                padding: "8px 6px",
                borderRadius: 6,
                border: paymentMethod === "ORANGE_MONEY" ? "2px solid #f97316" : "1px solid var(--gray-200)",
                background: paymentMethod === "ORANGE_MONEY" ? "rgba(249, 115, 22, 0.15)" : "var(--bg-card)",
                color: paymentMethod === "ORANGE_MONEY" ? "#c2410c" : "var(--gray-700)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Smartphone size={15} />
              <span style={{ textAlign: "center", lineHeight: 1.2 }}>Orange</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              style={{
                padding: "8px 6px",
                borderRadius: 6,
                border: paymentMethod === "CARD" ? "2px solid var(--brand-600)" : "1px solid var(--gray-200)",
                background: paymentMethod === "CARD" ? "var(--brand-50)" : "var(--bg-card)",
                color: paymentMethod === "CARD" ? "var(--brand-700)" : "var(--gray-700)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CreditCard size={15} />
              <span style={{ textAlign: "center", lineHeight: 1.2 }}>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("BANK_TRANSFER")}
              style={{
                padding: "8px 6px",
                borderRadius: 6,
                border: paymentMethod === "BANK_TRANSFER" ? "2px solid var(--brand-600)" : "1px solid var(--gray-200)",
                background: paymentMethod === "BANK_TRANSFER" ? "var(--brand-50)" : "var(--bg-card)",
                color: paymentMethod === "BANK_TRANSFER" ? "var(--brand-700)" : "var(--gray-700)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Building2 size={15} />
              <span style={{ textAlign: "center", lineHeight: 1.2 }}>Virement</span>
            </button>
          </div>

          {/* Cash Tendered & Change Return Calculator */}
          {paymentMethod === "CASH" && (
            <div style={{ marginTop: 12, padding: 10, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--gray-200)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-700)" }}>Cash Received (CFA):</span>
                {changeAmount > 0 && (
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--success)" }}>
                    Change: {formatCFA(changeAmount)}
                  </span>
                )}
              </div>

              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder={`Enter amount (e.g. ${total})`}
                className="form-input"
                style={{ margin: 0, padding: "8px 10px", fontSize: "0.9rem", fontWeight: 700 }}
              />

              {/* Quick Note Amount Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setCashTendered(total.toString())}
                  style={{ padding: "4px 8px", borderRadius: 4, background: "var(--gray-100)", border: "1px solid var(--gray-300)", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Exact ({formatCFA(total)})
                </button>
                {CFA_NOTES.filter((n) => n >= total).slice(0, 4).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt.toString())}
                    style={{ padding: "4px 8px", borderRadius: 4, background: "var(--gray-100)", border: "1px solid var(--gray-300)", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    {formatCFA(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--gray-200)", background: "var(--bg-card)" }}>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: 4 }}>
              <span>Subtotal:</span>
              <span>{formatCFA(subtotal)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--danger)", marginBottom: 6 }}>
              <span>Discount ({discountPercent}%):</span>
              <span>- {formatCFA(discountAmount)}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gray-900)" }}>Total Amount:</span>
            <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--brand-700)" }}>
              {formatCFA(total)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || hasInsufficientTender}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.95rem", fontWeight: 800 }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" /> Validating Transaction...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> Confirm &amp; Print Receipt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instant Thermal Receipt Modal after Sale */}
      {lastCompletedSale && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 440, padding: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--success)", fontWeight: 700, fontSize: "0.92rem" }}>
                <CheckCircle size={18} /> Sale Completed Successfully
              </div>
              <button onClick={() => setLastCompletedSale(null)} className="modal-close"><X size={16} /></button>
            </div>

            {/* Thermal Print Receipt Preview */}
            <div
              id="printable-sale-receipt"
              style={{
                padding: "20px 24px",
                background: "#fff",
                color: "#111827",
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.8rem",
                lineHeight: 1.45,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000" }}>INVENSMART AI</div>
                <div style={{ fontSize: "0.72rem", color: "#4b5563" }}>MAC COMPUTERS SARL • Douala, Cameroun</div>
                <div style={{ fontSize: "0.68rem", color: "#6b7280" }}>Tel: (+237) 651 704 545 • NIU: M01241678902A</div>
                <div style={{ margin: "8px 0", borderTop: "1px dashed #6b7280" }} />
                <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>••• TICKET DE CAISSE •••</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.74rem", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>N° Ticket:</span>
                  <span style={{ fontWeight: 700 }}>{lastCompletedSale.receiptNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Réf Vente:</span>
                  <span>{lastCompletedSale.saleNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Mode Paiement:</span>
                  <span style={{ fontWeight: 700 }}>{lastCompletedSale.paymentMethod}</span>
                </div>
                {lastCompletedSale.customerName && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Client:</span>
                    <span>{lastCompletedSale.customerName}</span>
                  </div>
                )}
              </div>

              <div style={{ margin: "6px 0", borderTop: "1px dashed #6b7280" }} />

              <table style={{ width: "100%", fontSize: "0.76rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #111" }}>
                    <th style={{ padding: "3px 0" }}>Article</th>
                    <th style={{ textAlign: "center", padding: "3px 0" }}>Qté</th>
                    <th style={{ textAlign: "right", padding: "3px 0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastCompletedSale.items.map((it: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px dotted #e5e7eb" }}>
                      <td style={{ padding: "4px 0" }}>{it.product.name}</td>
                      <td style={{ textAlign: "center", padding: "4px 0" }}>{it.quantity}</td>
                      <td style={{ textAlign: "right", padding: "4px 0", fontWeight: 700 }}>
                        {formatCFA(it.quantity * parseFloat(it.product.sellingPrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ margin: "8px 0 6px", borderTop: "1px dashed #6b7280" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 900, margin: "4px 0" }}>
                <span>TOTAL (CFA):</span>
                <span>{formatCFA(lastCompletedSale.total)}</span>
              </div>

              {lastCompletedSale.paymentMethod === "CASH" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.74rem", marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Reçu Espèces:</span>
                    <span>{formatCFA(lastCompletedSale.cashTendered)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Monnaie Rendue:</span>
                    <span>{formatCFA(lastCompletedSale.changeAmount)}</span>
                  </div>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 12 }}>
                <div style={{ fontSize: "0.68rem", color: "#4b5563" }}>Merci pour votre achat !</div>
              </div>
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gray-200)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Printer size={14} /> Imprimer Ticket
              </button>
              <button onClick={() => setLastCompletedSale(null)} className="btn btn-secondary btn-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
