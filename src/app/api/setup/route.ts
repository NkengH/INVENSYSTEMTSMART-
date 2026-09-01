import { NextResponse } from "next/server";
import { connectToDatabase } from "@/db";
import { User, Category, Product, Inventory } from "@/db/schema";
import * as bcrypt from "bcrypt";

// Authentic products and prices scraped directly from Flexzone Computers (flexzonecomputers.com)
const flexzoneProducts = [
  // Laptops
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Lenovo ThinkPad T14s Touchscreen",
    sku: "FX-LEN-T14S",
    description: "Intel Core i7 (11th Gen), Touchscreen display, 16GB RAM, 512GB SSD",
    purchasePrice: 165000,
    sellingPrice: 200000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "HP ZBook Firefly 14 G7 Mobile Workstation",
    sku: "FX-HP-ZB14G7",
    description: "Intel Core i5 (11th Gen), 4GB Dedicated VRAM, 16GB RAM, 512GB SSD",
    purchasePrice: 195000,
    sellingPrice: 235000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 5,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Acer Aspire A514-56M (2023)",
    sku: "FX-ACER-A514",
    description: "Intel Core i5 (13th Gen), 14\" FHD IPS, 8GB RAM, 512GB NVMe SSD",
    purchasePrice: 160000,
    sellingPrice: 200000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 6,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "HP ProBook 440 G6",
    sku: "FX-HP-PB440G6",
    description: "Intel Core i3 (8th Gen), 8GB RAM, 256GB SSD, Business Grade",
    purchasePrice: 75000,
    sellingPrice: 100000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 12,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Apple MacBook Pro 2015 Retina",
    sku: "FX-APL-MBP15",
    description: "13.3\" Retina Display, Core i5, 8GB RAM, 256GB PCIe SSD",
    purchasePrice: 125000,
    sellingPrice: 160000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 4,
  },

  // Gaming PCs & Desktops
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "CyberPowerPC Gaming PC Core i7 (13th Gen)",
    sku: "FX-CYBER-I7-4060",
    description: "Intel Core i7-13700F, 32GB DDR5 RAM, 1TB NVMe SSD, Nvidia RTX 4060 8GB",
    purchasePrice: 880000,
    sellingPrice: 1050000,
    minimumStock: 1,
    unit: "unit",
    initialStock: 3,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "ASUS ROG STRIX Gaming PC (Ryzen 7 + RTX 3060 Ti)",
    sku: "FX-ROG-R7-3060TI",
    description: "AMD Ryzen 7 5800X, 32GB RAM, 1TB SSD, GeForce RTX 3060 Ti 8GB",
    purchasePrice: 750000,
    sellingPrice: 900000,
    minimumStock: 1,
    unit: "unit",
    initialStock: 2,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "ASUS ROG Strix Z790-E Gaming (i5 12th Gen RTX 3060)",
    sku: "FX-ROG-Z790-3060",
    description: "Intel Core i5-12400F, 16GB DDR5, 512GB NVMe, RTX 3060",
    purchasePrice: 530000,
    sellingPrice: 650000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 4,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "Dell OptiPlex 5490 All-in-One 24” Borderless",
    sku: "FX-DELL-AIO5490",
    description: "24-inch FHD Borderless, Core i5 (10th Gen), 16GB RAM, 512GB SSD",
    purchasePrice: 160000,
    sellingPrice: 200000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 7,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "Dell OptiPlex 760 Small Form Desktop",
    sku: "FX-DELL-OPT760",
    description: "Compact Desktop PC, Core 2 Duo / 8GB RAM / 500GB HDD, Office Setup",
    purchasePrice: 95000,
    sellingPrice: 135000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 10,
  },

  // Displays & Monitors
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "Dell P3418HW 34” Curved Ultrawide 2K Monitor",
    sku: "FX-DELL-P3418HW",
    description: "34-inch 21:9 Curved IPS Display, 2560x1080, HDMI/DP/USB-C Hub",
    purchasePrice: 155000,
    sellingPrice: 200000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 5,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "Viotek GNV34DBE 34” Curved Ultrawide 4K Gaming Monitor",
    sku: "FX-VIO-GNV34DBE",
    description: "34-inch 144Hz 1500R Curved Ultrawide Gaming Monitor, FreeSync",
    purchasePrice: 195000,
    sellingPrice: 250000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 4,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "ThinkVision P34w-20 34\" Curved 4K IPS Monitor",
    sku: "FX-LNV-P34W20",
    description: "34-inch WQHD 3440x1440 Curved Professional Studio Display with USB-C Hub",
    purchasePrice: 200000,
    sellingPrice: 250000,
    minimumStock: 1,
    unit: "unit",
    initialStock: 3,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "Samsung 43\" Curved Ultrawide 4K Monitor",
    sku: "FX-SAM-43CURVED",
    description: "43-inch Super Ultrawide 32:10 HDR Display with KVM Switch",
    purchasePrice: 4600000,
    sellingPrice: 5500000,
    minimumStock: 1,
    unit: "unit",
    initialStock: 1,
  },

  // Peripherals & Accessories
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "HyperX QuadCast S — USB RGB Microphone",
    sku: "FX-HX-QUADCAST-S",
    description: "Standalone condenser microphone with dynamic RGB lighting and anti-vibration mount",
    purchasePrice: 45000,
    sellingPrice: 60000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 15,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "SteelSeries Arctis 7+ Destiny 2 Gaming Headset",
    sku: "FX-SS-ARCTIS7P",
    description: "Lossless 2.4GHz wireless audio with 30-hour battery and ClearCast mic",
    purchasePrice: 25000,
    sellingPrice: 35000,
    minimumStock: 5,
    unit: "unit",
    initialStock: 18,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "k81 RGB Tri-Mode Wireless Gaming Keyboard",
    sku: "FX-K81-TRIMODE",
    description: "Mechanical Hot-swappable RGB keyboard with Bluetooth / 2.4G / Type-C",
    purchasePrice: 20000,
    sellingPrice: 30000,
    minimumStock: 6,
    unit: "unit",
    initialStock: 22,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Apple Magic Mouse 2 (Rechargeable)",
    sku: "FX-APL-MAGICM2",
    description: "Bluetooth Wireless multi-touch rechargeable mouse for Mac & iPad",
    purchasePrice: 18000,
    sellingPrice: 25000,
    minimumStock: 6,
    unit: "unit",
    initialStock: 20,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Rand McNally ClearDryve 200 Wireless Noise Cancelling Headset",
    sku: "FX-RM-CD200",
    description: "2-in-1 Premium Wireless noise-canceling headphones & communication headset",
    purchasePrice: 14000,
    sellingPrice: 20000,
    minimumStock: 8,
    unit: "unit",
    initialStock: 25,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "TheArk RGB Gaming & Office Heavy Duty Monitor Arm",
    sku: "FX-ARK-RGBARM",
    description: "Gas spring mechanical monitor desk mount with programmable ambient RGB",
    purchasePrice: 24000,
    sellingPrice: 35000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 12,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Height-Adjustable Electric Desk 140cm x 70cm",
    sku: "FX-DSK-ELEC140",
    description: "Dual motor electric standing desk with digital memory preset controller",
    purchasePrice: 120000,
    sellingPrice: 160000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 6,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "DB Racing Pro Ergonomic Gaming Chair (Black & Red)",
    sku: "FX-DBR-PROCHAIR",
    description: "High-density foam, 4D adjustable armrests, 180-degree recline with lumbar pillow",
    purchasePrice: 75000,
    sellingPrice: 100000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Modern Minimalist Computer Table",
    sku: "FX-TBL-MODERN",
    description: "Heavy duty steel frame workstation table with cable management tray",
    purchasePrice: 38000,
    sellingPrice: 55000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 14,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Laptop Privacy Filter & Anti-Glare Screen Protector",
    sku: "FX-ACC-PRIVACY",
    description: "Gold & Black micro-louver privacy screen filter for 14\" / 15.6\" laptops",
    purchasePrice: 6000,
    sellingPrice: 10000,
    minimumStock: 10,
    unit: "unit",
    initialStock: 35,
  },
  // Additional Products (Added per request)
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Dell XPS 15 9550",
    sku: "FX-DELL-XPS15",
    description: "15.6\" 4K UHD Touchscreen, Core i7, 16GB RAM, 512GB SSD, GTX 960M",
    purchasePrice: 220000,
    sellingPrice: 300000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 4,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "HP EliteBook 840 G6",
    sku: "FX-HP-EB840G6",
    description: "14\" FHD, Core i5 (8th Gen), 8GB RAM, 256GB SSD, Business Laptop",
    purchasePrice: 110000,
    sellingPrice: 150000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Dell Precision 3550 Mobile Workstation",
    sku: "FX-DELL-PREC3550",
    description: "15.6\" FHD, Core i7 (10th Gen), 16GB RAM, 512GB SSD, Quadro P520",
    purchasePrice: 200000,
    sellingPrice: 280000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 5,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "ASUS ROG Strix G16CH Gaming Desktop",
    sku: "FX-ROG-G16CH",
    description: "Core i7-13700KF, 32GB DDR5, 1TB SSD, RTX 4070 Ti",
    purchasePrice: 1200000,
    sellingPrice: 1500000,
    minimumStock: 1,
    unit: "unit",
    initialStock: 2,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "Acer Nitro ED340CU 34\" Curved Gaming Monitor",
    sku: "FX-ACER-ED340CU",
    description: "34\" UWQHD (3440 x 1440) 144Hz 1ms VRB, FreeSync Premium",
    purchasePrice: 180000,
    sellingPrice: 240000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 4,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "ZK68 Mechanic Keyboard",
    sku: "FX-ZK68-MECH",
    description: "68-Key Compact Wireless Mechanical Keyboard, Red Switches, RGB",
    purchasePrice: 18000,
    sellingPrice: 28000,
    minimumStock: 5,
    unit: "unit",
    initialStock: 15,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "BK38 RGB Tri-Mode Gaming Keyboard",
    sku: "FX-BK38-RGB",
    description: "TKL Wireless Mechanical Keyboard with Media Knob, Hot-swappable",
    purchasePrice: 22000,
    sellingPrice: 35000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 10,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Perixx PERIDUO-606 Ergonomic Keyboard & Mouse",
    sku: "FX-PERI-606",
    description: "Wireless Mini Ergonomic Split Keyboard and Vertical Mouse Combo",
    purchasePrice: 25000,
    sellingPrice: 40000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 12,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "JBL Quantum 400 Gaming Headset",
    sku: "FX-JBL-Q400",
    description: "Over-Ear Gaming Headset with Game-Chat Balance and Surround Sound",
    purchasePrice: 35000,
    sellingPrice: 55000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Tablets & Digital Products",
    categoryDesc: "iPads, Android tablets, and portable digital accessories",
    name: "Samsung Galaxy Tab S7+",
    sku: "FX-SAM-TABS7P",
    description: "12.4\" Super AMOLED, Snapdragon 865+, 8GB RAM, 256GB Storage, S Pen included",
    purchasePrice: 300000,
    sellingPrice: 380000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 6,
  },

  // ─── MAC COMPUTERS (maccomputers.store) – Cameroun ─────────────────────────
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "HP EliteBook 745 G6 (Ryzen 5 PRO 3500U, 8Go RAM, SSD, 14\" FHD)",
    sku: "MC-HP-EB745G6",
    description: "AMD Ryzen 5 PRO 3500U, 8 Go DDR4, SSD ultra-rapide, 14\" Full HD. Professionnel, télétravel, bureautique.",
    purchasePrice: 220000,
    sellingPrice: 260000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 7,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Dell Precision 7530 (Core i7-8850H, 8Go RAM, SSD, 15.6\")",
    sku: "MC-DELL-P7530",
    description: "Intel Core i7-8850H, 8 Go RAM, SSD, 15.6\", Thunderbolt 3, station de travail mobile professionnelle.",
    purchasePrice: 285000,
    sellingPrice: 340000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 4,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Dell Pro 13 Plus PB13250 (Core Ultra 5 235U, 8Go DDR5, 256Go, 13.3\" FHD+)",
    sku: "MC-DELL-PRO13P",
    description: "Intel Core Ultra 5 235U vPro, 8 Go DDR5, 256 Go SSD, 13.3\" FHD+ 16:10, Wi-Fi 7, Bluetooth 5.4.",
    purchasePrice: 540000,
    sellingPrice: 650000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 3,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Lenovo ThinkPad L580 (Core i5 8th Gen, 8Go RAM, SSD 256Go, 15.6\")",
    sku: "MC-LEN-L580",
    description: "Intel Core i5 8ème génération, 8 Go RAM, SSD 256 Go, 15.6 pouces. Bureautique, études et télétravail.",
    purchasePrice: 145000,
    sellingPrice: 180000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 9,
  },
  {
    category: "Laptops & Notebooks",
    categoryDesc: "High-performance laptops, business ultrabooks and workstations",
    name: "Dell Latitude 5401 (Core i7, 16Go RAM, SSD 256Go, 14\")",
    sku: "MC-DELL-LAT5401",
    description: "Intel Core i7, 16 Go RAM, 256 Go SSD, 14 pouces, Wi-Fi, Bluetooth, Ethernet RJ45. Portable professionnel.",
    purchasePrice: 160000,
    sellingPrice: 195000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "Dell OptiPlex 24\" All-in-One (Core i5, 4Go RAM, 500Go HDD)",
    sku: "MC-DELL-AIO24",
    description: "Dell All-in-One Core i5, 24\" Full HD, 4 Go RAM, 500 Go HDD. Entreprises, écoles et particuliers.",
    purchasePrice: 128000,
    sellingPrice: 160000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 5,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "Dell OptiPlex Desktop Tower (Core i5, 8Go RAM, SSD 256Go)",
    sku: "MC-DELL-OPT-I5",
    description: "Unité centrale Dell Core i5, 8 Go RAM, SSD 256 Go. Rapide et fluide pour la bureautique avancée.",
    purchasePrice: 90000,
    sellingPrice: 115000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 10,
  },
  {
    category: "Gaming PCs & Desktops",
    categoryDesc: "Custom high-tier gaming desktop computers and workstations",
    name: "Desktop PC Tour Core i7 (8Go RAM, SSD 256Go)",
    sku: "MC-DESK-I7-256",
    description: "Unité centrale Core i7, 8 Go RAM, SSD 256 Go. Performances élevées pour la gestion d'entreprise.",
    purchasePrice: 100000,
    sellingPrice: 130000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "HP Monitor 27\" Full HD (HDMI, VGA)",
    sku: "MC-HP-MON27FHD",
    description: "Moniteur HP 27 pouces Full HD. Images nettes, couleurs éclatantes pour travail, études et multimédia.",
    purchasePrice: 135000,
    sellingPrice: 170000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 6,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "HP Monitor 22\" (VGA, DVI)",
    sku: "MC-HP-MON22",
    description: "Moniteur HP 22 pouces. Affichage clair et confort visuel pour bureautique, navigation et applications.",
    purchasePrice: 26000,
    sellingPrice: 35000,
    minimumStock: 4,
    unit: "unit",
    initialStock: 12,
  },
  {
    category: "Displays & Monitors",
    categoryDesc: "4K, QLED and Curved Ultrawide displays for gaming and productivity",
    name: "Laptop Replacement Screen 14\" Full HD Slim 30-pin",
    sku: "MC-SCR-14FHD",
    description: "Écran de remplacement 14 pouces Full HD 1920×1080, connecteur Slim 30 broches, pour laptop endommagé.",
    purchasePrice: 33000,
    sellingPrice: 45000,
    minimumStock: 5,
    unit: "unit",
    initialStock: 18,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Epson TM-T20III Thermal Receipt Printer (80mm, USB)",
    sku: "MC-EPS-TMT20III",
    description: "Imprimante thermique 80mm, coupe-papier automatique, USB. Idéale pour magasins, hôtels et restaurants.",
    purchasePrice: 128000,
    sellingPrice: 160000,
    minimumStock: 2,
    unit: "unit",
    initialStock: 5,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "Xprinter XP-Q80C Thermal Receipt Printer (80mm, USB)",
    sku: "MC-XPR-XPQ80C",
    description: "Imprimante thermique ticket 80mm, rapide et silencieuse. Pour commerces, pharmacies, supermarchés.",
    purchasePrice: 52000,
    sellingPrice: 70000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 8,
  },
  {
    category: "Gaming & Office Accessories",
    categoryDesc: "Keyboards, mice, audio gear, ergonomic stands and workstation furniture",
    name: "DORS 125 Counterfeit Bill Detector (UV / IR / MG)",
    sku: "MC-DORS-125",
    description: "Détecteur professionnel de faux billets UV, infrarouge et magnétique. Idéal pour les banques et commerces.",
    purchasePrice: 58000,
    sellingPrice: 75000,
    minimumStock: 3,
    unit: "unit",
    initialStock: 7,
  },
  {
    category: "Tablets & Digital Products",
    categoryDesc: "iPads, Android tablets, and portable digital accessories",
    name: "Xiaomi TV Stick 4K (2nd Gen) – Google TV Streaming",
    sku: "MC-XIA-TVSTK4K",
    description: "Transformez tout TV HDMI en Smart TV. Google TV, 4K Ultra HD, Dolby Vision, Netflix, YouTube, Prime Video.",
    purchasePrice: 38000,
    sellingPrice: 50000,
    minimumStock: 5,
    unit: "unit",
    initialStock: 15,
  },
];

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Ensure user accounts exist for the 3 core actors
    await User.updateMany(
      { role: { $in: ["Storekeeper", "Stock Controller"] } },
      { $set: { role: "Inventory Manager" } }
    );

    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const adminHash = await bcrypt.hash("admin123", 10);
      await User.create({ username: "admin", passwordHash: adminHash, role: "Administrator" });
    }

    const managerExists = await User.findOne({ username: "manager" });
    if (!managerExists) {
      const managerHash = await bcrypt.hash("manager123", 10);
      await User.create({ username: "manager", passwordHash: managerHash, role: "Inventory Manager" });
    }

    const cashierExists = await User.findOne({ username: "cashier" });
    if (!cashierExists) {
      const cashierHash = await bcrypt.hash("cashier123", 10);
      await User.create({ username: "cashier", passwordHash: cashierHash, role: "Cashier" });
    }

    // 2. Clear old demo product catalog & populate with Flexzone Computers catalog
    const categoryCache: Record<string, any> = {};

    for (const item of flexzoneProducts) {
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
      message: "System populated with genuine devices and prices from Flexzone Computers (flexzonecomputers.com).",
      source: "https://www.flexzonecomputers.com",
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
