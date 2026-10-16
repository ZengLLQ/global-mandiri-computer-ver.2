const fs = require('fs');
const path = require('path');

const PRODUCTS_DATA = [
  // PC Rakitan & Desktop
  {
    sku: "GMC-PC-01",
    name: "GMC Creator Pro Workstation Intel Core i9-14900K",
    brand: "Intel",
    category: "pc-rakitan",
    price_idr: 45500000,
    compare_at_price_idr: 48900000,
    stock: 5,
    variants: [
      { name: "RAM 64GB / SSD 2TB", price: 45500000, sku: "GMC-PC-01-64G" },
      { name: "RAM 128GB / SSD 4TB", price: 54900000, sku: "GMC-PC-01-128G" }
    ],
    specs: {
      "Processor": "Intel Core i9-14900K 24-Core 32-Thread",
      "VGA": "NVIDIA GeForce RTX 4080 Super 16GB",
      "Motherboard": "ASUS ROG Strix Z790-E Gaming WiFi II",
      "RAM": "Corsair Vengeance DDR5 6000MHz",
      "Storage": "Samsung 990 PRO NVMe M.2 SSD",
      "PSU": "Seasonic Vertex GX-1000 1000W 80+ Gold",
      "Case": "Fractal Design North Charcoal Black",
      "Cooler": "DeepCool LT720 360mm AIO Liquid Cooler"
    },
    description: "Workstation komputasi kelas berat dirancang khusus untuk video rendering 8K, 3D modelling visual effect, dan komputasi arsitektur dengan stabilitas termal tinggi.",
    is_featured: true
  },
  {
    sku: "GMC-PC-02",
    name: "GMC Esport Battlestation AMD Ryzen 7 7800X3D",
    brand: "AMD",
    category: "pc-rakitan",
    price_idr: 28900000,
    compare_at_price_idr: 31000000,
    stock: 8,
    variants: [
      { name: "RTX 4070 Super 12GB", price: 28900000, sku: "GMC-PC-02-4070" },
      { name: "RTX 4075 Ti Super 16GB", price: 34500000, sku: "GMC-PC-02-4070TI" }
    ],
    specs: {
      "Processor": "AMD Ryzen 7 7800X3D with 3D V-Cache",
      "VGA": "MSI GeForce RTX 4070 Super Gaming X Slim",
      "Motherboard": "ASRock B650 Steel Legend WiFi",
      "RAM": "G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6000MHz",
      "Storage": "Kingston KC3000 1TB PCIe 4.0 NVMe",
      "PSU": "Corsair RM750e 750W ATX 3.0 Gold",
      "Case": "Lian Li Lancool 216 RGB Black",
      "Cooler": "Thermalright Peerless Assassin 120 SE"
    },
    description: "PC gaming kompetitif dengan efisiensi thermal dan cache 3D terbesar untuk menjamin frame rate tinggi konsisten di resolusi 1440p dan 4K.",
    is_featured: true
  },
  {
    sku: "GMC-PC-03",
    name: "GMC Office Compact Slim Core i5-14400",
    brand: "Intel",
    category: "pc-rakitan",
    price_idr: 8900000,
    compare_at_price_idr: 9500000,
    stock: 15,
    variants: [
      { name: "RAM 16GB / SSD 512GB", price: 8900000, sku: "GMC-PC-03-16G" },
      { name: "RAM 32GB / SSD 1TB", price: 10400000, sku: "GMC-PC-03-32G" }
    ],
    specs: {
      "Processor": "Intel Core i5-14400 10-Core",
      "Motherboard": "MSI PRO H610M-E DDR4",
      "RAM": "Kingston Fury Beast 16GB (2x8GB) 3200MHz",
      "Storage": "WD Green SN350 512GB NVMe SSD",
      "PSU": "FSP HV PRO 550W 85+",
      "Case": "Casing Slim M-ATX Office Black"
    },
    description: "Desktop kantor efisien dan hemat daya, cocok untuk produktivitas akuntansi, administrasi multi-tab, kasir, dan pengadaan kantor skala menengah.",
    is_featured: false
  },

  // Laptop
  {
    sku: "GMC-LAP-01",
    name: "ASUS ROG Zephyrus G16 OLED GU605MI",
    brand: "ASUS",
    category: "laptop",
    price_idr: 34999000,
    compare_at_price_idr: 36999000,
    stock: 4,
    variants: [
      { name: "Eclipse Gray / 1TB SSD", price: 34999000, sku: "GMC-LAP-01-GRY" },
      { name: "Platinum White / 2TB SSD", price: 38499000, sku: "GMC-LAP-01-WHT" }
    ],
    specs: {
      "Layar": "16 inch ROG Nebula OLED 2.5K 240Hz 0.2ms",
      "Processor": "Intel Core Ultra 9 185H (AI Boost NPU)",
      "VGA": "NVIDIA GeForce RTX 4070 8GB GDDR6",
      "RAM": "32GB LPDDR5X 7467MHz",
      "Storage": "1TB PCIe 4.0 NVMe M.2 SSD",
      "Bobot": "1.85 kg super tipis 1.49 cm",
      "Garansi": "2 Tahun Resmi ASUS Indonesia + VIP Perfect Warranty"
    },
    description: "Laptop gaming dan kreatif premium berbobot ringan dengan bodi aluminium unibody CNC dan layar OLED 240Hz visual memukau.",
    is_featured: true
  },
  {
    sku: "GMC-LAP-02",
    name: "Lenovo Legion Pro 5 16IRX9 Core i7-14700HX",
    brand: "Lenovo",
    category: "laptop",
    price_idr: 27499000,
    compare_at_price_idr: 28999000,
    stock: 6,
    variants: [
      { name: "RTX 4060 8GB", price: 27499000, sku: "GMC-LAP-02-4060" },
      { name: "RTX 4070 8GB", price: 31999000, sku: "GMC-LAP-02-4070" }
    ],
    specs: {
      "Layar": "16 inch WQXGA (2560x1600) IPS 240Hz 500nits 100% sRGB",
      "Processor": "Intel Core i7-14700HX 20-Core",
      "VGA": "NVIDIA GeForce RTX 4060 8GB 140W TGP",
      "RAM": "16GB (2x8GB) DDR5 5600MHz",
      "Storage": "1TB SSD M.2 2280 PCIe 4.0 NVMe",
      "Garansi": "3 Tahun Legion Ultimate Support + ADP"
    },
    description: "Laptop performa tinggi dengan pendingin ColdFront 5.0 ganda dan TGP maksimal untuk multitasking berat dan gaming kompetitif.",
    is_featured: true
  },
  {
    sku: "GMC-LAP-03",
    name: "Acer Swift Go 14 OLED Intel Core Ultra 7",
    brand: "Acer",
    category: "laptop",
    price_idr: 15499000,
    compare_at_price_idr: 16999000,
    stock: 10,
    variants: [
      { name: "Silver 16GB/1TB", price: 15499000, sku: "GMC-LAP-03-SLV" }
    ],
    specs: {
      "Layar": "14 inch 2.8K OLED 90Hz 100% DCI-P3",
      "Processor": "Intel Core Ultra 7 155H",
      "RAM": "16GB LPDDR5X",
      "Storage": "1TB PCIe NVMe SSD",
      "Kamera": "1440p QHD Webcam AI Noise Reduction",
      "Bobot": "1.32 kg tipis ringkas"
    },
    description: "Ultrabook portabel dengan baterai tahan lama dan layar sinematik OLED 2.8K untuk eksekutif, mahasiswa, dan kreator konten aktif.",
    is_featured: false
  },
  {
    sku: "GMC-LAP-04",
    name: "Apple MacBook Air 13 M3 16GB 512GB",
    brand: "Apple",
    category: "laptop",
    price_idr: 19999000,
    compare_at_price_idr: 21499000,
    stock: 7,
    variants: [
      { name: "Midnight 16GB/512GB", price: 19999000, sku: "GMC-LAP-04-MID" },
      { name: "Space Gray 16GB/512GB", price: 19999000, sku: "GMC-LAP-04-GRY" },
      { name: "Starlight 16GB/512GB", price: 19999000, sku: "GMC-LAP-04-STR" }
    ],
    specs: {
      "Chip": "Apple M3 8-core CPU 10-core GPU 16-core Neural Engine",
      "Layar": "13.6 inch Liquid Retina True Tone",
      "RAM": "16GB Unified Memory",
      "Storage": "512GB Fast SSD Storage",
      "Baterai": "Hingga 18 jam masa pakai",
      "Garansi": "1 Tahun Garansi Resmi Apple Indonesia"
    },
    description: "Tipis menawan dengan efisiensi daya revolusioner chip Apple M3 dan bodi kokoh berbahan daur ulang 100% ramah lingkungan.",
    is_featured: true
  },
  {
    sku: "GMC-LAP-05",
    name: "Dell Inspiron 14 5430 Core i7-1360P",
    brand: "Dell",
    category: "laptop",
    price_idr: 14250000,
    compare_at_price_idr: 15100000,
    stock: 9,
    variants: [
      { name: "Platinum Silver", price: 14250000, sku: "GMC-LAP-05-SLV" }
    ],
    specs: {
      "Layar": "14.0 inch 16:10 FHD+ (1920x1200) Anti-glare",
      "Processor": "Intel Core i7-1360P 12-Core",
      "RAM": "16GB LPDDR5 4800MHz",
      "Storage": "1TB M.2 PCIe NVMe SSD",
      "Audio": "Waves MaxxAudio Pro speakers",
      "Garansi": "2 Tahun Onsite Service Resmi Dell"
    },
    description: "Laptop bisnis andal dengan layanan teknisi Dell onsite langsung datang ke kantor atau rumah Anda.",
    is_featured: false
  },

  // Monitor
  {
    sku: "GMC-MON-01",
    name: "ASUS ROG Swift OLED PG27AQDM 240Hz",
    brand: "ASUS",
    category: "monitor",
    price_idr: 16999000,
    compare_at_price_idr: 18500000,
    stock: 5,
    variants: [
      { name: "27 Inch 240Hz OLED", price: 16999000, sku: "GMC-MON-01-27" }
    ],
    specs: {
      "Ukuran Layar": "26.5 inch QHD (2560x1440) OLED",
      "Refresh Rate": "240Hz ultra smooth",
      "Response Time": "0.03ms (GTG)",
      "Color Gamut": "99% DCI-P3, HDR10",
      "Fitur": "Custom Heatsink, G-SYNC Compatible",
      "Garansi": "3 Tahun Resmi ASUS Indonesia (Termasuk garansi burn-in)"
    },
    description: "Monitor OLED gaming tier tertinggi dengan kejernihan warna mutlak dan response time 0.03ms tanpa ghosting sama sekali.",
    is_featured: true
  },
  {
    sku: "GMC-MON-02",
    name: "LG UltraGear 27GR75Q-B IPS 165Hz QHD",
    brand: "LG",
    category: "monitor",
    price_idr: 3850000,
    compare_at_price_idr: 4200000,
    stock: 14,
    variants: [
      { name: "27 Inch QHD 165Hz", price: 3850000, sku: "GMC-MON-02-27" }
    ],
    specs: {
      "Ukuran": "27 inch IPS 2560 x 1440 QHD",
      "Refresh Rate": "165Hz",
      "Response Time": "1ms MBR",
      "Sinkronisasi": "AMD FreeSync & NVIDIA G-Sync Compatible",
      "Port": "2x HDMI 2.0, 1x DP 1.4"
    },
    description: "Pilihan monitor 1440p terfavorit untuk gaming dan produktivitas dengan akurasi warna panel IPS LG original.",
    is_featured: true
  },
  {
    sku: "GMC-MON-03",
    name: "BenQ PD2706U 4K Designer Monitor IPS sRGB",
    brand: "BenQ",
    category: "monitor",
    price_idr: 9750000,
    compare_at_price_idr: 10500000,
    stock: 4,
    variants: [
      { name: "27 Inch 4K UHD USB-C", price: 9750000, sku: "GMC-MON-03-4K" }
    ],
    specs: {
      "Resolusi": "3840x2160 4K UHD IPS",
      "Warna": "95% P3, 99% sRGB, Delta E ≤ 2",
      "Koneksi": "USB-C 90W Power Delivery + KVM Switch",
      "Stand": "Ergonomis tilt, swivel, pivot, height adjust"
    },
    description: "Monitor profesional untuk editor foto, desainer grafis, dan visual artist dengan sertifikasi akurasi warna Calman dan Pantone.",
    is_featured: false
  },
  {
    sku: "GMC-MON-04",
    name: "ViewSonic VX2479-HD-PRO IPS 180Hz 1ms",
    brand: "ViewSonic",
    category: "monitor",
    price_idr: 1750000,
    compare_at_price_idr: 1950000,
    stock: 20,
    variants: [
      { name: "24 Inch FHD 180Hz", price: 1750000, sku: "GMC-MON-04-24" }
    ],
    specs: {
      "Ukuran": "23.8 inch SuperClear IPS Full HD",
      "Refresh Rate": "180Hz ultra-fluid",
      "Fitur": "HDR10, Eye ProTech Flicker-Free"
    },
    description: "Monitor gaming budget terpopuler dengan refresh rate 180Hz dan panel SuperClear IPS sudut pandang luas.",
    is_featured: false
  },
  {
    sku: "GMC-MON-05",
    name: "AOC Q27G2S/EU 27 Inch QHD 165Hz IPS",
    brand: "AOC",
    category: "monitor",
    price_idr: 3450000,
    compare_at_price_idr: 3750000,
    stock: 11,
    variants: [
      { name: "27 Inch 2K IPS", price: 3450000, sku: "GMC-MON-05-27" }
    ],
    specs: {
      "Layar": "27 inch QHD 2560x1440 IPS",
      "Refresh Rate": "165Hz G-Sync Compatible",
      "Desain": "Frameless 3 sisi dengan stand putar penuh"
    },
    description: "Monitor bezel tipis dengan dudukan fleksibel ergonomis dan tampilan QHD jernih untuk gaming kompetitif.",
    is_featured: false
  },

  // Processor (CPU)
  {
    sku: "GMC-CPU-01",
    name: "Intel Core i9-14900K LGA1700 Box",
    brand: "Intel",
    category: "processor",
    price_idr: 9650000,
    compare_at_price_idr: 10250000,
    stock: 12,
    variants: [
      { name: "Box Garansi 3 Tahun", price: 9650000, sku: "GMC-CPU-01-BOX" }
    ],
    specs: {
      "Cores / Threads": "24 Cores (8 P-Cores + 16 E-Cores) / 32 Threads",
      "Max Turbo Frequency": "Hingga 6.0 GHz Thermal Velocity Boost",
      "Cache": "36MB Intel Smart Cache",
      "Socket": "LGA1700 (Chipset Z790/B760)",
      "iGPU": "Intel UHD Graphics 770"
    },
    description: "Prosesor desktop terkencang untuk komputasi render berat, kompilasi software raksasa, dan frame rate game maksimal.",
    is_featured: true
  },
  {
    sku: "GMC-CPU-02",
    name: "AMD Ryzen 7 7800X3D AM5 Box",
    brand: "AMD",
    category: "processor",
    price_idr: 6850000,
    compare_at_price_idr: 7400000,
    stock: 10,
    variants: [
      { name: "Box Garansi 3 Tahun", price: 6850000, sku: "GMC-CPU-02-BOX" }
    ],
    specs: {
      "Cores / Threads": "8 Cores / 16 Threads",
      "Clock": "Base 4.2GHz / Boost 5.0GHz",
      "L3 Cache": "96MB 3D V-Cache Technology",
      "Socket": "AM5 (Support DDR5 & PCIe 5.0)",
      "TDP": "120W Efisiensi Tinggi"
    },
    description: "Raja prosesor gaming dunia dengan teknologi AMD 3D V-Cache yang memberikan performa frame rate tak tertandingi.",
    is_featured: true
  },
  {
    sku: "GMC-CPU-03",
    name: "Intel Core i5-14600KF LGA1700 Box",
    brand: "Intel",
    category: "processor",
    price_idr: 4750000,
    compare_at_price_idr: 5100000,
    stock: 15,
    variants: [
      { name: "Box Garansi 3 Tahun", price: 4750000, sku: "GMC-CPU-03-BOX" }
    ],
    specs: {
      "Cores / Threads": "14 Cores (6P + 8E) / 20 Threads",
      "Max Turbo": "5.3 GHz",
      "Socket": "LGA1700",
      "Catatan": "Memerlukan kartu grafis diskrit (VGA)"
    },
    description: "Sweet spot prosesor kelas menengah ke atas untuk rakitan PC gaming dan streaming tanpa kompromi.",
    is_featured: false
  },
  {
    sku: "GMC-CPU-04",
    name: "AMD Ryzen 5 7600 AM5 Box with Wraith Stealth",
    brand: "AMD",
    category: "processor",
    price_idr: 3250000,
    compare_at_price_idr: 3550000,
    stock: 18,
    variants: [
      { name: "Box with Cooler", price: 3250000, sku: "GMC-CPU-04-BOX" }
    ],
    specs: {
      "Cores / Threads": "6 Cores / 12 Threads",
      "Boost Clock": "Hingga 5.1GHz",
      "Socket": "AM5",
      "Bundled Cooler": "AMD Wraith Stealth Cooler Termasuk"
    },
    description: "Gerbang masuk generasi platform AM5 DDR5 dengan efisiensi daya 65W luar biasa dingin dan kencang.",
    is_featured: false
  },
  {
    sku: "GMC-CPU-05",
    name: "Intel Core i3-14100 LGA1700 Box",
    brand: "Intel",
    category: "processor",
    price_idr: 2150000,
    compare_at_price_idr: 2350000,
    stock: 20,
    variants: [
      { name: "Box with Stock Cooler", price: 2150000, sku: "GMC-CPU-05-BOX" }
    ],
    specs: {
      "Cores / Threads": "4 Cores / 8 Threads",
      "Max Turbo": "4.7 GHz",
      "iGPU": "Intel UHD Graphics 730"
    },
    description: "Prosesor 4-core kencang untuk komputasi harian, kasir, belajar, dan PC office hemat budget.",
    is_featured: false
  },

  // Motherboard
  {
    sku: "GMC-MOB-01",
    name: "ASUS ROG Strix Z790-E Gaming WiFi II",
    brand: "ASUS",
    category: "motherboard",
    price_idr: 8950000,
    compare_at_price_idr: 9600000,
    stock: 5,
    variants: [
      { name: "LGA1700 ATX", price: 8950000, sku: "GMC-MOB-01-ATX" }
    ],
    specs: {
      "Socket": "LGA1700 Intel 14th/13th Gen",
      "VRM": "18+1+2 Power Stages 110A",
      "Memory": "4x DDR5 Slot hingga 8000+ MT/s (OC)",
      "Konektivitas": "Wi-Fi 7, Intel 2.5Gb LAN, USB 20Gbps Type-C",
      "Slot M.2": "5x M.2 Slots dengan Heatsink Tebal"
    },
    description: "Motherboard flagship Intel Z790 dengan dukungan Wi-Fi 7 mutakhir dan penyaluran daya overclocking kokoh.",
    is_featured: true
  },
  {
    sku: "GMC-MOB-02",
    name: "MSI MAG B650 Tomahawk WiFi AM5",
    brand: "MSI",
    category: "motherboard",
    price_idr: 3750000,
    compare_at_price_idr: 4100000,
    stock: 9,
    variants: [
      { name: "AM5 ATX", price: 3750000, sku: "GMC-MOB-02-ATX" }
    ],
    specs: {
      "Socket": "AM5 AMD Ryzen 7000/8000 Series",
      "VRM": "14+2+1 Duet Rail Power System",
      "LAN & Wireless": "Wi-Fi 6E, Realtek 2.5G LAN",
      "Storage": "3x M.2 Shield Frozr"
    },
    description: "Pilihan utama rakitan Ryzen AM5 dengan desain all-black berwibawa dan kestabilan VRM teruji.",
    is_featured: false
  },
  {
    sku: "GMC-MOB-03",
    name: "GIGABYTE B760M AORUS ELITE AX DDR5",
    brand: "GIGABYTE",
    category: "motherboard",
    price_idr: 2850000,
    compare_at_price_idr: 3100000,
    stock: 12,
    variants: [
      { name: "LGA1700 M-ATX", price: 2850000, sku: "GMC-MOB-03-MATX" }
    ],
    specs: {
      "Form Factor": "Micro-ATX",
      "RAM": "DDR5 hingga 7600MHz",
      "Wireless": "Intel Wi-Fi 6E 802.11ax",
      "PCIe": "PCIe 4.0 x16 dengan EZ-Latch"
    },
    description: "Motherboard micro-ATX ringkas kaya fitur dengan Wi-Fi 6E dan thermal guard aluminium tebal.",
    is_featured: false
  },
  {
    sku: "GMC-MOB-04",
    name: "ASRock B650M-HDV/M.2 AM5 DDR5",
    brand: "ASRock",
    category: "motherboard",
    price_idr: 1850000,
    compare_at_price_idr: 2050000,
    stock: 16,
    variants: [
      { name: "Micro-ATX AM5", price: 1850000, sku: "GMC-MOB-04-MATX" }
    ],
    specs: {
      "Socket": "AM5 Ryzen 7000/8000",
      "RAM": "2x DDR5 Slot",
      "VRM": "8+2+1 Power Phase",
      "Fitur": "PCIe 5.0 M.2 Blazing Slot"
    },
    description: "Motherboard AM5 paling hemat budget dengan dukungan slot SSD PCIe 5.0 tercepat.",
    is_featured: false
  },

  // GPU / VGA
  {
    sku: "GMC-GPU-01",
    name: "MSI GeForce RTX 4080 SUPER 16G GAMING X SLIM",
    brand: "MSI",
    category: "gpu",
    price_idr: 19450000,
    compare_at_price_idr: 20900000,
    stock: 4,
    variants: [
      { name: "Black Edition 16GB", price: 19450000, sku: "GMC-GPU-01-BLK" },
      { name: "White Edition 16GB", price: 19950000, sku: "GMC-GPU-01-WHT" }
    ],
    specs: {
      "VRAM": "16GB GDDR6X 256-bit",
      "Boost Clock": "2610 MHz (Extreme Performance)",
      "Cooling": "TRI FROZR 3 dengan TORX FAN 5.0",
      "Desain": "Slim Form Factor tidak memakan banyak slot",
      "Power": "1x 16-pin 12VHPWR (Rekomendasi PSU 750W-850W)"
    },
    description: "Performa ray-tracing 4K kelas monster dengan arsitektur NVIDIA Ada Lovelace dan frame generation DLSS 3.5.",
    is_featured: true
  },
  {
    sku: "GMC-GPU-02",
    name: "GIGABYTE GeForce RTX 4070 SUPER WINDFORCE OC 12G",
    brand: "GIGABYTE",
    category: "gpu",
    price_idr: 10999000,
    compare_at_price_idr: 11800000,
    stock: 7,
    variants: [
      { name: "12GB GDDR6X", price: 10999000, sku: "GMC-GPU-02-12G" }
    ],
    specs: {
      "VRAM": "12GB GDDR6X 192-bit",
      "Cooling": "WINDFORCE 3X Fans dengan alternate spinning",
      "Outputs": "3x DisplayPort 1.4a, 1x HDMI 2.1a"
    },
    description: "VGA paling rasional untuk bermain game pada resolusi 1440p dengan setting grafis ultra dan DLSS 3.",
    is_featured: true
  },
  {
    sku: "GMC-GPU-03",
    name: "Zotac Gaming GeForce RTX 4060 Twin Edge 8GB",
    brand: "Zotac",
    category: "gpu",
    price_idr: 5150000,
    compare_at_price_idr: 5500000,
    stock: 14,
    variants: [
      { name: "Twin Edge 8GB", price: 5150000, sku: "GMC-GPU-03-8G" },
      { name: "White Edition 8GB", price: 5350000, sku: "GMC-GPU-03-8GW" }
    ],
    specs: {
      "VRAM": "8GB GDDR6",
      "Dimensi": "Panjang 22.2 cm compact dual fan",
      "Power": "1x 8-pin PCIe (Sangat hemat daya 115W)"
    },
    description: "VGA kompak dua kipas hemat daya, muat di hampir semua casing PC m-ATX dan ITX modern.",
    is_featured: false
  },
  {
    sku: "GMC-GPU-04",
    name: "ASRock AMD Radeon RX 7800 XT Challenger 16GB OC",
    brand: "ASRock",
    category: "gpu",
    price_idr: 8950000,
    compare_at_price_idr: 9600000,
    stock: 6,
    variants: [
      { name: "16GB OC Edition", price: 8950000, sku: "GMC-GPU-04-16G" }
    ],
    specs: {
      "VRAM": "16GB GDDR6 256-bit",
      "Arsitektur": "AMD RDNA 3 dengan DisplayPort 2.1",
      "Fitur": "AMD HYPR-RX & FidelityFX Super Resolution"
    },
    description: "VRAM 16GB lega siap melibas tekstur game generasi terbaru tanpa khawatir kehabisan alokasi memori grafis.",
    is_featured: false
  },

  // RAM
  {
    sku: "GMC-RAM-01",
    name: "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz CL30",
    brand: "Corsair",
    category: "ram",
    price_idr: 2150000,
    compare_at_price_idr: 2350000,
    stock: 18,
    variants: [
      { name: "Black / Intel XMP & AMD EXPO", price: 2150000, sku: "GMC-RAM-01-BLK" },
      { name: "White / Intel XMP & AMD EXPO", price: 2250000, sku: "GMC-RAM-01-WHT" }
    ],
    specs: {
      "Kapasitas": "32GB (2 x 16GB Kit)",
      "Kecepatan": "DDR5 6000 MT/s",
      "Latency": "CL30-36-36-76 Low Latency",
      "Pencahayaan": "Ten-zone RGB dynamic lighting",
      "Garansi": "Limited Lifetime Warranty Distributor Resmi"
    },
    description: "RAM DDR5 berkecepatan 6000MHz dengan timing ketat CL30, kombinasi paling optimal untuk prosesor AMD Ryzen 7000 dan Intel 14th Gen.",
    is_featured: true
  },
  {
    sku: "GMC-RAM-02",
    name: "G.Skill Trident Z5 RGB DDR5 64GB (2x32GB) 6400MHz",
    brand: "G.Skill",
    category: "ram",
    price_idr: 3950000,
    compare_at_price_idr: 4300000,
    stock: 8,
    variants: [
      { name: "Matte Black 64GB Kit", price: 3950000, sku: "GMC-RAM-02-64G" }
    ],
    specs: {
      "Kapasitas": "64GB (2 x 32GB Kit)",
      "Kecepatan": "6400MHz XMP 3.0",
      "Heatsink": "Aluminium Hairline Finish Mewah"
    },
    description: "Kapasitas besar 64GB untuk render animasi After Effects, simulasi arsitektur, dan machine learning lokal.",
    is_featured: false
  },
  {
    sku: "GMC-RAM-03",
    name: "Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz",
    brand: "Kingston",
    category: "ram",
    price_idr: 680000,
    compare_at_price_idr: 750000,
    stock: 30,
    variants: [
      { name: "16GB (2x8GB) Black", price: 680000, sku: "GMC-RAM-03-16G" }
    ],
    specs: {
      "Kapasitas": "16GB (2x8GB)",
      "Kecepatan": "DDR4 3200MHz CL16",
      "Heatsink": "Low-profile hitam minimalis"
    },
    description: "RAM DDR4 standar emas paling stabil dan kompatibel luas untuk upgrade PC kantor dan rumahan.",
    is_featured: false
  },

  // SSD
  {
    sku: "GMC-SSD-01",
    name: "Samsung 990 PRO NVMe M.2 SSD PCIe 4.0",
    brand: "Samsung",
    category: "ssd",
    price_idr: 2350000,
    compare_at_price_idr: 2550000,
    stock: 22,
    variants: [
      { name: "1TB (Read 7450MB/s)", price: 2350000, sku: "GMC-SSD-01-1TB" },
      { name: "2TB (Read 7450MB/s)", price: 3950000, sku: "GMC-SSD-01-2TB" }
    ],
    specs: {
      "Antarmuka": "PCIe Gen 4.0 x4, NVMe 2.0",
      "Kecepatan Baca": "Hingga 7,450 MB/detik",
      "Kecepatan Tulis": "Hingga 6,900 MB/detik",
      "DRAM Cache": "Low Power DDR4 SDRAM",
      "Garansi": "5 Tahun Garansi Resmi Samsung Indonesia"
    },
    description: "Kecepatan transfer data mutlak puncak PCIe Gen 4 dengan ketahanan termal manajemen daya terbaik di kelasnya.",
    is_featured: true
  },
  {
    sku: "GMC-SSD-02",
    name: "Kingston KC3000 PCIe 4.0 NVMe M.2 SSD",
    brand: "Kingston",
    category: "ssd",
    price_idr: 1650000,
    compare_at_price_idr: 1850000,
    stock: 25,
    variants: [
      { name: "1TB (7000MB/s)", price: 1650000, sku: "GMC-SSD-02-1TB" },
      { name: "2TB (7000MB/s)", price: 2850000, sku: "GMC-SSD-02-2TB" }
    ],
    specs: {
      "Read Speed": "7,000 MB/s",
      "Write Speed": "6,000 MB/s",
      "Heatsink": "Graphene aluminium heat spreader tipis"
    },
    description: "SSD PCIe 4.0 berperforma tinggi dengan harga sangat kompetitif untuk OS drive dan instalasi game berat.",
    is_featured: false
  },
  {
    sku: "GMC-SSD-03",
    name: "WD Black SN770 NVMe SSD PCIe Gen 4",
    brand: "WD",
    category: "ssd",
    price_idr: 1250000,
    compare_at_price_idr: 1400000,
    stock: 20,
    variants: [
      { name: "1TB (5150MB/s)", price: 1250000, sku: "GMC-SSD-03-1TB" },
      { name: "500GB (5000MB/s)", price: 825000, sku: "GMC-SSD-03-500G" }
    ],
    specs: {
      "Interface": "PCIe Gen4 x4 NVMe v1.4",
      "Kecepatan": "5,150 MB/s Read",
      "Fitur": "WD Dashboard Gaming Mode"
    },
    description: "SSD gaming tanpa DRAM yang memanfaatkan HMB untuk kecepatan responsif tanpa boros daya.",
    is_featured: false
  },
  {
    sku: "GMC-SSD-04",
    name: "Crucial P3 Plus M.2 NVMe SSD",
    brand: "Crucial",
    category: "ssd",
    price_idr: 1100000,
    compare_at_price_idr: 1250000,
    stock: 15,
    variants: [
      { name: "1TB (5000MB/s)", price: 1100000, sku: "GMC-SSD-04-1TB" }
    ],
    specs: {
      "Kapasitas": "1TB",
      "Kecepatan": "5000 MB/s Read, 4200 MB/s Write"
    },
    description: "Pilihan upgrade storage hemat untuk laptop dan desktop generasi baru.",
    is_featured: false
  },

  // HDD
  {
    sku: "GMC-HDD-01",
    name: "Seagate BarraCuda 3.5 Inch 7200RPM SATA3",
    brand: "Seagate",
    category: "hdd",
    price_idr: 950000,
    compare_at_price_idr: 1050000,
    stock: 18,
    variants: [
      { name: "2TB / 256MB Cache", price: 950000, sku: "GMC-HDD-01-2TB" },
      { name: "4TB / 256MB Cache", price: 1550000, sku: "GMC-HDD-01-4TB" }
    ],
    specs: {
      "Form Factor": "3.5 inch Internal Desktop",
      "Antarmuka": "SATA 6Gb/s",
      "Kecepatan Rotasi": "7200 RPM",
      "Garansi": "2 Tahun Garansi Resmi Seagate Indonesia"
    },
    description: "Harddisk internal kapasitas lega untuk arsip data video mentah, backup sistem berkala, dan pustaka file besar.",
    is_featured: false
  },
  {
    sku: "GMC-HDD-02",
    name: "WD Red Plus NAS Hard Drive 3.5 Inch CMR",
    brand: "WD",
    category: "hdd",
    price_idr: 1850000,
    compare_at_price_idr: 2050000,
    stock: 10,
    variants: [
      { name: "4TB CMR 5400RPM", price: 1850000, sku: "GMC-HDD-02-4TB" }
    ],
    specs: {
      "Teknologi": "CMR (Conventional Magnetic Recording)",
      "Workload Rate": "180 TB/tahun operasi 24/7",
      "Garansi": "3 Tahun Resmi WD"
    },
    description: "Khusus untuk penyimpanan jaringan NAS, server rumahan, dan backup data bisnis non-stop 24 jam.",
    is_featured: false
  },

  // Power Supply (PSU)
  {
    sku: "GMC-PSU-01",
    name: "Seasonic Vertex GX-850 850W ATX 3.0 80+ Gold Full Modular",
    brand: "Seasonic",
    category: "psu",
    price_idr: 2850000,
    compare_at_price_idr: 3100000,
    stock: 10,
    variants: [
      { name: "850W Gold Full Modular", price: 2850000, sku: "GMC-PSU-01-850" },
      { name: "1000W Gold Full Modular", price: 3450000, sku: "GMC-PSU-01-1000" }
    ],
    specs: {
      "Daya": "850 Watt Riil",
      "Sertifikasi": "80 PLUS Gold Certified",
      "Standar": "ATX 3.0 & PCIe 5.0 Ready (Native 12VHPWR Cable)",
      "Kabel": "Full Modular dengan kabel embossed bertekstur",
      "Garansi": "10-12 Tahun Garansi Resmi Seasonic"
    },
    description: "PSU standar ATX 3.0 kelas dunia dengan daya murni stabil dan proteksi lonjakan voltase menyeluruh untuk hardware mahal Anda.",
    is_featured: true
  },
  {
    sku: "GMC-PSU-02",
    name: "Corsair RM750e 750W 80+ Gold Fully Modular ATX 3.0",
    brand: "Corsair",
    category: "psu",
    price_idr: 1750000,
    compare_at_price_idr: 1950000,
    stock: 15,
    variants: [
      { name: "750W 80+ Gold", price: 1750000, sku: "GMC-PSU-02-750" }
    ],
    specs: {
      "Daya": "750 Watt",
      "Efisiensi": "80 PLUS Gold & Cybenetics Platinum",
      "Fitur": "Zero RPM Fan Mode untuk operasi hening"
    },
    description: "PSU hening dengan efisiensi tinggi dan kabel modular praktis untuk manajemen kabel rapi.",
    is_featured: false
  },
  {
    sku: "GMC-PSU-03",
    name: "FSP Hydro K PRO 600W 80+ Bronze",
    brand: "FSP",
    category: "psu",
    price_idr: 725000,
    compare_at_price_idr: 800000,
    stock: 20,
    variants: [
      { name: "600W Bronze", price: 725000, sku: "GMC-PSU-03-600" }
    ],
    specs: {
      "Daya": "600 Watt",
      "Sertifikasi": "80 PLUS Bronze",
      "Kabel": "Flat Black Cables rapi",
      "Garansi": "5 Tahun Resmi FSP"
    },
    description: "Pilihan utama rakitan PC gaming terjangkau dengan keandalan komponen pabrikan FSP ternama.",
    is_featured: false
  },

  // Casing
  {
    sku: "GMC-CAS-01",
    name: "Fractal Design North Charcoal Black Walnut Wood",
    brand: "Fractal Design",
    category: "casing",
    price_idr: 2550000,
    compare_at_price_idr: 2850000,
    stock: 6,
    variants: [
      { name: "Charcoal Black / Wood Front", price: 2550000, sku: "GMC-CAS-01-BLK" },
      { name: "Chalk White / Oak Wood Front", price: 2650000, sku: "GMC-CAS-01-WHT" }
    ],
    specs: {
      "Material Depan": "Kayu Walnut asli FSC Certified",
      "Kompatibilitas Motherboard": "ATX / mATX / Mini-ITX",
      "Dukungan Radiator": "Hingga 360mm depan, 240mm atas",
      "I/O Depan": "1x USB 3.1 Gen 2 Type-C, 2x USB 3.0, Audio"
    },
    description: "Casing estetika Skandinavia modern dengan panel depan kayu kenari alami, menyatu anggun di ruang kerja modern.",
    is_featured: true
  },
  {
    sku: "GMC-CAS-02",
    name: "Lian Li O11 Dynamic EVO RGB Dual Chamber",
    brand: "Lian Li",
    category: "casing",
    price_idr: 2850000,
    compare_at_price_idr: 3150000,
    stock: 7,
    variants: [
      { name: "Black Edition", price: 2850000, sku: "GMC-CAS-02-BLK" },
      { name: "Pure White Edition", price: 2950000, sku: "GMC-CAS-02-WHT" }
    ],
    specs: {
      "Tipe": "Dual Chamber ATX Showcase",
      "Kaca": "Panoramic Seamless Tempered Glass Depan & Samping",
      "Dukungan Kipas": "Hingga 10x 120mm fans"
    },
    description: "Casing pameran akuarium dual-chamber legendaris dengan strip LED RGB diffused dan ruang komponen terpisah.",
    is_featured: true
  },
  {
    sku: "GMC-CAS-03",
    name: "NZXT H5 Flow Compact ATX Airflow Mid-Tower",
    brand: "NZXT",
    category: "casing",
    price_idr: 1450000,
    compare_at_price_idr: 1650000,
    stock: 12,
    variants: [
      { name: "Matte Black", price: 1450000, sku: "GMC-CAS-03-BLK" },
      { name: "Matte White", price: 1450000, sku: "GMC-CAS-03-WHT" }
    ],
    specs: {
      "Panel Depan": "Perforated Mesh Airflow Maksimal",
      "Dedicated GPU Fan": "Kipas bawah bersudut khusus pendingin VGA",
      "Kabel Management": "Jalur kabel rapi dengan velcro ties"
    },
    description: "Desain minimalis khas NZXT dengan ventilasi mesh tembus udara dan kipas khusus peniup VGA bawah.",
    is_featured: false
  },

  // Cooling (Air & Water/AIO)
  {
    sku: "GMC-COL-01",
    name: "DeepCool LT720 360mm High-Performance AIO Liquid Cooler",
    brand: "DeepCool",
    category: "cooling",
    price_idr: 1950000,
    compare_at_price_idr: 2200000,
    stock: 9,
    variants: [
      { name: "Black 360mm", price: 1950000, sku: "GMC-COL-01-360B" },
      { name: "White 360mm", price: 2050000, sku: "GMC-COL-01-360W" }
    ],
    specs: {
      "Ukuran Radiator": "360mm Aluminium",
      "Pompa": "Generasi ke-4 3-phase drive motor",
      "Tutup Pompa": "Infinity Mirror Multidimensional Geometris",
      "Socket": "Intel LGA1700/1200/115x, AMD AM5/AM4"
    },
    description: "Pendingin cair AIO 360mm dengan pompa bertenaga tinggi dan tutup cermin infinity geometris yang menawan.",
    is_featured: true
  },
  {
    sku: "GMC-COL-02",
    name: "Noctua NH-D15 chromax.black Dual-Tower Air Cooler",
    brand: "Noctua",
    category: "cooling",
    price_idr: 1850000,
    compare_at_price_idr: 2050000,
    stock: 8,
    variants: [
      { name: "chromax.black Dual-Fan", price: 1850000, sku: "GMC-COL-02-BLK" }
    ],
    specs: {
      "Tipe": "Dual-Tower Air Cooler",
      "Kipas": "2x NF-A15 HS-PWM chromax.black 140mm",
      "Heatpipes": "6x Copper Heatpipes berselubung nikel hitam",
      "Garansi": "6 Tahun Garansi Manufaktur Noctua"
    },
    description: "Raja pendingin udara legendaris Noctua dalam balutan warna all-black tanpa kompromi performa dan kesenyapan.",
    is_featured: false
  },
  {
    sku: "GMC-COL-03",
    name: "Thermalright Peerless Assassin 120 SE Dual Tower",
    brand: "Cooler Master",
    category: "cooling",
    price_idr: 580000,
    compare_at_price_idr: 650000,
    stock: 25,
    variants: [
      { name: "SE Dual Tower 120mm", price: 580000, sku: "GMC-COL-03-SE" }
    ],
    specs: {
      "Heatpipes": "6x 6mm AGHP Technology",
      "Kipas": "2x TL-C12C PWM Fans",
      "Performa": "Mampu menahan TDP hingga 240W"
    },
    description: "Air cooler paling fenomenal dengan rasio harga-ke-performa terbaik di dunia saat ini.",
    is_featured: false
  },

  // Fan Casing
  {
    sku: "GMC-FAN-01",
    name: "Lian Li UNI FAN TL LCD 120 Triple Pack with Controller",
    brand: "Lian Li",
    category: "fan",
    price_idr: 2150000,
    compare_at_price_idr: 2350000,
    stock: 6,
    variants: [
      { name: "Triple Pack Black", price: 2150000, sku: "GMC-FAN-01-BLK" },
      { name: "Triple Pack White", price: 2250000, sku: "GMC-FAN-01-WHT" }
    ],
    specs: {
      "Fitur Unik": "Layar LCD 1.6 inch 400x400 pada poros kipas",
      "Koneksi": "Daisy-Chain pin-to-pin tanpa kabel semrawut",
      "Kecepatan": "350 - 1900 RPM PWM"
    },
    description: "Kipas casing premium dengan layar LCD bawaan yang bisa menampilkan GIF, video MP4, atau suhu CPU realtime.",
    is_featured: false
  },
  {
    sku: "GMC-FAN-02",
    name: "be quiet! Silent Wings 4 120mm PWM High-Speed",
    brand: "be quiet!",
    category: "fan",
    price_idr: 375000,
    compare_at_price_idr: 420000,
    stock: 20,
    variants: [
      { name: "Single Pack 120mm", price: 375000, sku: "GMC-FAN-02-120" }
    ],
    specs: {
      "Bising": "Sangat hening di bawah 31.2 dB(A)",
      "Motor": "6-pole fan motor dengan fluid dynamic bearing"
    },
    description: "Kipas casing Jerman dirancang murni untuk kesenyapan mutlak dan aliran udara presisi tinggi.",
    is_featured: false
  },

  // Mouse
  {
    sku: "GMC-MOU-01",
    name: "Logitech G PRO X SUPERLIGHT 2 Wireless Gaming Mouse",
    brand: "Logitech",
    category: "mouse",
    price_idr: 2199000,
    compare_at_price_idr: 2399000,
    stock: 15,
    variants: [
      { name: "Black", price: 2199000, sku: "GMC-MOU-01-BLK" },
      { name: "White", price: 2199000, sku: "GMC-MOU-01-WHT" },
      { name: "Magenta", price: 2299000, sku: "GMC-MOU-01-MAG" }
    ],
    specs: {
      "Bobot": "Hanya 60 gram ultra-lightweight",
      "Sensor": "HERO 2 Sensor 32,000 DPI 500+ IPS",
      "Switch": "LIGHTFORCE Hybrid Optical-Mechanical Switches",
      "Polling Rate": "Hingga 4000Hz (0.25ms)",
      "Koneksi": "LIGHTSPEED Wireless + USB-C Charging"
    },
    description: "Mouse esport standar atlet pro dunia, sangat ringan dengan sensor HERO 2 ultra-presisi dan switch optik tahan double-click.",
    is_featured: true
  },
  {
    sku: "GMC-MOU-02",
    name: "Razer DeathAdder V3 Pro Wireless Ergonomic",
    brand: "Razer",
    category: "mouse",
    price_idr: 1999000,
    compare_at_price_idr: 2200000,
    stock: 12,
    variants: [
      { name: "Black", price: 1999000, sku: "GMC-MOU-02-BLK" },
      { name: "White", price: 1999000, sku: "GMC-MOU-02-WHT" }
    ],
    specs: {
      "Sensor": "Focus Pro 30K Optical Sensor",
      "Bentuk": "Ergonomis telapak tangan kanan nyaman",
      "Baterai": "Hingga 90 jam pemakaian"
    },
    description: "Bentuk ergonomis legendaris DeathAdder dalam bobot seringan 63 gram dengan switch optik Gen-3.",
    is_featured: false
  },
  {
    sku: "GMC-MOU-03",
    name: "Logitech MX Master 3S Wireless Performance Mouse",
    brand: "Logitech",
    category: "mouse",
    price_idr: 1550000,
    compare_at_price_idr: 1750000,
    stock: 14,
    variants: [
      { name: "Graphite", price: 1550000, sku: "GMC-MOU-03-GRP" },
      { name: "Pale Gray", price: 1550000, sku: "GMC-MOU-03-GRY" }
    ],
    specs: {
      "Scroll Wheel": "MagSpeed Electromagnetic 1000 lines/detik",
      "Klik": "Quiet Clicks 90% lebih hening",
      "Sensor": "8K DPI melacak di atas permukaan kaca"
    },
    description: "Mouse produktivitas nomor satu untuk akuntan, arsitek, programmer, dan kreator konten profesional.",
    is_featured: true
  },

  // Keyboard
  {
    sku: "GMC-KBD-01",
    name: "SteelSeries Apex Pro TKL (2023) OmniPoint 2.0",
    brand: "SteelSeries",
    category: "keyboard",
    price_idr: 3250000,
    compare_at_price_idr: 3600000,
    stock: 6,
    variants: [
      { name: "Tenkeyless English US", price: 3250000, sku: "GMC-KBD-01-TKL" }
    ],
    specs: {
      "Switch": "OmniPoint 2.0 Adjustable HyperMagnetic Switches",
      "Aktuasi": "Dapat diatur dari 0.1mm hingga 4.0mm per tombol",
      "Fitur Rapid Trigger": "Aktuasi ulang instan untuk pergerakan FPS",
      "Layar": "OLED Smart Display pada sudut atas"
    },
    description: "Keyboard mekanikal tercanggih dengan switch magnetik OmniPoint yang titik aktuasinya bisa dikustomisasi per tombol.",
    is_featured: true
  },
  {
    sku: "GMC-KBD-02",
    name: "Corsair K70 RGB PRO Mechanical Gaming Keyboard",
    brand: "Corsair",
    category: "keyboard",
    price_idr: 2150000,
    compare_at_price_idr: 2450000,
    stock: 10,
    variants: [
      { name: "Cherry MX Red Linear", price: 2150000, sku: "GMC-KBD-02-RED" }
    ],
    specs: {
      "Switch": "Original Cherry MX Mechanical Switches",
      "Polling Rate": "Corsair AXON 8,000Hz Hyper-polling",
      "Frame": "Aluminium anodized kokoh tahan banting"
    },
    description: "Rangka aluminium berkelas dengan switch Cherry MX Red asli dan roller volume khusus.",
    is_featured: false
  },
  {
    sku: "GMC-KBD-03",
    name: "Rexus Daxa M84 Ultimate Wireless Mechanical Keyboard",
    brand: "Rexus",
    category: "keyboard",
    price_idr: 890000,
    compare_at_price_idr: 1050000,
    stock: 16,
    variants: [
      { name: "Gateron Yellow Switch", price: 890000, sku: "GMC-KBD-03-YEL" },
      { name: "Gateron Brown Switch", price: 890000, sku: "GMC-KBD-03-BRN" }
    ],
    specs: {
      "Koneksi": "Triple Mode (Bluetooth 5.0, 2.4Ghz Dongle, Type-C)",
      "Hot-swappable": "5-pin South-facing sockets",
      "Baterai": "3750 mAh Lithium-ion rechargeable"
    },
    description: "Mechanical keyboard layout 75% kompak dengan fitur hotswap dan koneksi nirkabel multi-perangkat.",
    is_featured: false
  },

  // Speaker
  {
    sku: "GMC-SPK-01",
    name: "Edifier S880DB Hi-Res Certified Active Bookshelf Speakers",
    brand: "Edifier",
    category: "speaker",
    price_idr: 3450000,
    compare_at_price_idr: 3800000,
    stock: 7,
    variants: [
      { name: "White & Light Wood Finish", price: 3450000, sku: "GMC-SPK-01-WD" }
    ],
    specs: {
      "Sertifikasi": "Hi-Res Audio Certified hingga 192kHz/24bit",
      "Input": "USB Audio, Optical, Coaxial, Bluetooth 5.0, AUX",
      "Driver": "Titanium dome tweeter + 3.75 inch metal diaphragm woofer",
      "Desain": "Kayu putih modern elegan"
    },
    description: "Speaker meja bersuara jernih dengan DAC bawaan resolusi tinggi, sempurna untuk setup meja kerja minimalis.",
    is_featured: true
  },
  {
    sku: "GMC-SPK-02",
    name: "Creative Pebble Pro Minimalist USB-C Desktop Speakers",
    brand: "Creative",
    category: "speaker",
    price_idr: 799000,
    compare_at_price_idr: 899000,
    stock: 22,
    variants: [
      { name: "Alpine Green with RGB", price: 799000, sku: "GMC-SPK-02-GRN" }
    ],
    specs: {
      "Daya": "Hingga 30W Peak Power dengan USB-PD",
      "Driver": "2.25 inch full-range angled drivers",
      "RGB": "Glow ring ambient light bawah speaker"
    },
    description: "Speaker meja ringkas berbentuk kerikil dengan sudut tembak ke telinga pengguna dan daya bass solid.",
    is_featured: false
  },
  {
    sku: "GMC-SPK-03",
    name: "JBL Quantum DUO Gaming PC Speaker with RGB",
    brand: "JBL",
    category: "speaker",
    price_idr: 2250000,
    compare_at_price_idr: 2600000,
    stock: 8,
    variants: [
      { name: "Black Edition", price: 2250000, sku: "GMC-SPK-03-BLK" }
    ],
    specs: {
      "Suara": "JBL QuantumSOUND Signature",
      "Pencahayaan": "Sinkronisasi RGB visual beat",
      "Koneksi": "Bluetooth & 3.5mm AUX"
    },
    description: "Speaker stereo bertenaga dengan separasi audio tajam untuk mendengarkan derap langkah lawan dan dentuman bass film.",
    is_featured: false
  },

  // UPS
  {
    sku: "GMC-UPS-01",
    name: "APC Back-UPS Pro BR1500GI 1500VA / 865W LCD",
    brand: "APC",
    category: "ups",
    price_idr: 5150000,
    compare_at_price_idr: 5650000,
    stock: 6,
    variants: [
      { name: "1500VA LCD AVR", price: 5150000, sku: "GMC-UPS-01-1500" }
    ],
    specs: {
      "Kapasitas Daya": "1500VA / 865 Watt",
      "Teknologi": "Line-Interactive dengan Automatic Voltage Regulation (AVR)",
      "Layar": "LCD Status Real-time Voltase & Waktu Sisa Baterai",
      "Outlet": "8x IEC 320 C13 (6 Battery Backup + 2 Surge Only)",
      "Garansi": "2 Tahun Resmi APC by Schneider Electric"
    },
    description: "Pelindung daya profesional untuk workstation PC rakitan, NAS server, dan monitor agar tidak mati mendadak saat listrik padam.",
    is_featured: true
  },
  {
    sku: "GMC-UPS-02",
    name: "Prolink PRO700SFC 650VA Line Interactive with AVR",
    brand: "Prolink",
    category: "ups",
    price_idr: 680000,
    compare_at_price_idr: 750000,
    stock: 25,
    variants: [
      { name: "650VA Universal Socket", price: 680000, sku: "GMC-UPS-02-650" }
    ],
    specs: {
      "Kapasitas": "650VA / 360W",
      "Stopkontak": "Universal Socket colokan Indonesia standar",
      "Fitur": "Fast charging 90% kapasitas dalam 2-4 jam"
    },
    description: "UPS cadangan daya esensial untuk PC kasir, router Wi-Fi, dan komputer kantor agar ada waktu menyimpan pekerjaan.",
    is_featured: false
  },

  // Proyektor
  {
    sku: "GMC-PRJ-01",
    name: "XGIMI Horizon Pro 4K UHD Smart Home Projector",
    brand: "XGIMI",
    category: "proyektor",
    price_idr: 21999000,
    compare_at_price_idr: 24500000,
    stock: 4,
    variants: [
      { name: "Horizon Pro 4K 2200 ANSI", price: 21999000, sku: "GMC-PRJ-01-4K" }
    ],
    specs: {
      "Resolusi": "3840 x 2160 (4K UHD) dengan 8.29 juta piksel",
      "Kecerahan": "2200 ANSI Lumens terang benderang",
      "Speaker": "Dual 8W Harman Kardon soundbar bawaan",
      "Sistem": "Android TV resmi dengan Chromecast",
      "Kalibrasi": "Auto Keystone, Auto Focus, Intelligent Obstacle Avoidance"
    },
    description: "Proyektor 4K sinematik cerdas dengan speaker Harman Kardon terintegrasi dan kalibrasi layar otomatis tanpa ribet.",
    is_featured: true
  },
  {
    sku: "GMC-PRJ-02",
    name: "Optoma HD146X Full HD 1080p DLP Projector 3600 Lumens",
    brand: "Optoma",
    category: "proyektor",
    price_idr: 9250000,
    compare_at_price_idr: 10200000,
    stock: 5,
    variants: [
      { name: "1080p 3600 ANSI", price: 9250000, sku: "GMC-PRJ-02-FHD" }
    ],
    specs: {
      "Resolusi": "1080p (1920x1080)",
      "Kecerahan": "3600 Lumens cocok untuk ruang rapat terang",
      "Input Lag": "Enhanced Gaming Mode 16ms"
    },
    description: "Proyektor serbaguna terang benderang untuk presentasi ruang meeting kantor hingga hiburan bioskop keluarga.",
    is_featured: false
  },

  // Starlink & Networking
  {
    sku: "GMC-NET-01",
    name: "Starlink Standard Kit Actuated Internet Satelit Resmi",
    brand: "SpaceX (Starlink)",
    category: "starlink",
    price_idr: 5900000,
    compare_at_price_idr: 7800000,
    stock: 8,
    variants: [
      { name: "Standard Kit Residensial / Roam", price: 5900000, sku: "GMC-NET-01-STD" }
    ],
    specs: {
      "Antena": "Electronic Phased Array otomatis melacak satelit",
      "Router": "Wi-Fi 5 Dual Band 3x3 MIMO",
      "Ketahanan Cuaca": "IP54 tahan hujan deras dan cuaca ekstrem",
      "Kelengkapan": "Antena piringan, dudukan base, router, kabel 15.2m, kabel daya",
      "Garansi": "1 Tahun Garansi Resmi Starlink Indonesia"
    },
    description: "Kit resmi internet satelit kecepatan tinggi latensi rendah untuk area pulau, perkebunan, vila terpencil, maupun backup kantor di Surabaya.",
    is_featured: true
  },
  {
    sku: "GMC-NET-02",
    name: "Ubiquiti UniFi U6-Pro Wi-Fi 6 Access Point",
    brand: "Ubiquiti",
    category: "networking",
    price_idr: 2950000,
    compare_at_price_idr: 3250000,
    stock: 12,
    variants: [
      { name: "UniFi U6-Pro Ceiling Mount", price: 2950000, sku: "GMC-NET-02-U6P" }
    ],
    specs: {
      "Frekuensi": "Wi-Fi 6 Dual-Band (5.3 Gbps aggregate throughput)",
      "Kapasitas Klien": "350+ perangkat bersamaan tanpa lag",
      "Power": "Power over Ethernet (PoE 802.3at)",
      "Manajemen": "UniFi Network Controller Software terpusat"
    },
    description: "Access point enterprise grade untuk kafe, perkantoran, dan rumah mewah dengan roaming mulus tanpa putus.",
    is_featured: true
  },
  {
    sku: "GMC-NET-03",
    name: "MikroTik RouterBOARD RB5009UG+S+IN",
    brand: "MikroTik",
    category: "networking",
    price_idr: 3650000,
    compare_at_price_idr: 3950000,
    stock: 9,
    variants: [
      { name: "RB5009 2.5G + 10G SFP+", price: 3650000, sku: "GMC-NET-03-RB" }
    ],
    specs: {
      "CPU": "Quad-core 1.4 GHz Marvell Armada ARMv8",
      "Port": "7x Gigabit Ethernet, 1x 2.5G Ethernet, 1x 10G SFP+ cage",
      "OS": "RouterOS v7 Level 5 License"
    },
    description: "Router bertenaga tinggi untuk manajemen bandwidth kantor, multi-WAN load balancing, dan failover otomatis.",
    is_featured: false
  },
  {
    sku: "GMC-NET-04",
    name: "TP-Link Deco XE75 Pro AXE5400 Tri-Band Mesh Wi-Fi 6E (2-Pack)",
    brand: "TP-Link",
    category: "networking",
    price_idr: 3950000,
    compare_at_price_idr: 4350000,
    stock: 7,
    variants: [
      { name: "2-Pack White", price: 3950000, sku: "GMC-NET-04-2PK" }
    ],
    specs: {
      "Standar": "Wi-Fi 6E Tri-Band (Pita 6GHz bebas gangguan)",
      "Port": "1x 2.5 Gbps Port + 2x Gigabit per unit",
      "Jangkauan": "Hingga 500 meter persegi mencakup rumah 3 lantai"
    },
    description: "Sistem mesh Wi-Fi 6E cerdas dengan pita frekuensi 6GHz eksklusif bebas tabrakan sinyal tetangga.",
    is_featured: false
  },
  {
    sku: "GMC-NET-05",
    name: "UGREEN USB 3.0 to Gigabit Ethernet Network Adapter",
    brand: "UGREEN",
    category: "networking",
    price_idr: 165000,
    compare_at_price_idr: 195000,
    stock: 40,
    variants: [
      { name: "USB-A to RJ45", price: 165000, sku: "GMC-NET-05-USBA" },
      { name: "USB-C to RJ45", price: 195000, sku: "GMC-NET-05-USBC" }
    ],
    specs: {
      "Kecepatan": "10/100/1000 Mbps Gigabit",
      "Bodi": "Aluminium abu-abu kokoh plug-and-play"
    },
    description: "Dongle adapter LAN praktis untuk laptop tipis yang tidak memiliki port kabel jaringan RJ45.",
    is_featured: false
  },

  // Printer
  {
    sku: "GMC-PRN-01",
    name: "Epson EcoTank L3250 All-in-One Wi-Fi Ink Tank Printer",
    brand: "Epson",
    category: "printer",
    price_idr: 2550000,
    compare_at_price_idr: 2750000,
    stock: 15,
    variants: [
      { name: "Wi-Fi All-in-One", price: 2550000, sku: "GMC-PRN-01-WF" }
    ],
    specs: {
      "Fungsi": "Print, Scan, Copy dengan Wi-Fi Direct",
      "Kapasitas Tinta": "Hingga 4.500 halaman hitam / 7.500 halaman warna per botol",
      "Kecepatan": "Hingga 10.0 ipm (Hitam) / 5.0 ipm (Warna)",
      "Garansi": "2 Tahun atau 30.000 halaman Resmi Epson Indonesia"
    },
    description: "Printer tabung tangki resmi paling laris di Indonesia dengan biaya cetak super irit dan konektivitas nirkabel smartphone.",
    is_featured: true
  },
  {
    sku: "GMC-PRN-02",
    name: "Brother DCP-T720DW Ink Tank Auto Duplex Wireless Printer",
    brand: "Brother",
    category: "printer",
    price_idr: 3450000,
    compare_at_price_idr: 3750000,
    stock: 11,
    variants: [
      { name: "Duplex + ADF Wireless", price: 3450000, sku: "GMC-PRN-02-ADF" }
    ],
    specs: {
      "Fitur": "Auto 2-sided Duplex Printing & Automatic Document Feeder (ADF) 20 lembar",
      "Kecepatan": "17 ipm hitam / 16.5 ipm warna",
      "Kapasitas Kertas": "Baki kertas tertutup 150 lembar"
    },
    description: "Printer kantor tangguh dengan fitur cetak bolak-balik otomatis (duplex) dan scan dokumen banyak lembar sekaligus.",
    is_featured: false
  },
  {
    sku: "GMC-PRN-03",
    name: "Canon PIXMA G2010 Ink Tank Multifunction",
    brand: "Canon",
    category: "printer",
    price_idr: 1850000,
    compare_at_price_idr: 2050000,
    stock: 14,
    variants: [
      { name: "USB All-in-One", price: 1850000, sku: "GMC-PRN-03-USB" }
    ],
    specs: {
      "Tipe": "Print, Scan, Copy via USB",
      "Desain": "Tabung tinta terintegrasi transparan"
    },
    description: "Multifungsi ekonomis untuk kebutuhan cetak tugas sekolah, skripsi, dan administrasi toko harian.",
    is_featured: false
  },

  // Additional 15+ Products to exceed 80 products across diverse brands
  {
    sku: "GMC-ACC-01",
    name: "Anker 737 Power Bank (PowerCore 24K) 140W",
    brand: "Anker",
    category: "laptop",
    price_idr: 1850000,
    compare_at_price_idr: 2100000,
    stock: 12,
    variants: [
      { name: "24,000mAh 140W GaN", price: 1850000, sku: "GMC-ACC-01-24K" }
    ],
    specs: {
      "Kapasitas": "24,000mAh",
      "Output": "Hingga 140W Ultra-Fast Charging via USB-C PD 3.1",
      "Layar": "Smart Digital Display daya & suhu baterai"
    },
    description: "Power bank bertenaga tinggi sanggup mengisi daya laptop MacBook Pro, Dell XPS, dan ASUS ROG saat bepergian.",
    is_featured: false
  },
  {
    sku: "GMC-ACC-02",
    name: "Vention 10-in-1 USB-C Multifunction Docking Station",
    brand: "Vention",
    category: "laptop",
    price_idr: 650000,
    compare_at_price_idr: 750000,
    stock: 25,
    variants: [
      { name: "Space Gray 10-in-1", price: 650000, sku: "GMC-ACC-02-10IN1" }
    ],
    specs: {
      "Port": "4K HDMI, VGA, Gigabit LAN, 3x USB 3.0, SD/TF, 100W PD",
      "Bodi": "Aluminium alloy pembuang panas optimal"
    },
    description: "Hub multifungsi USB-C lengkap mengubah laptop tipis menjadi workstation monitor ganda di meja kantor.",
    is_featured: false
  },
  {
    sku: "GMC-SSD-05",
    name: "SanDisk Extreme Portable SSD V2 1TB 1050MB/s",
    brand: "SanDisk",
    category: "ssd",
    price_idr: 1650000,
    compare_at_price_idr: 1850000,
    stock: 18,
    variants: [
      { name: "1TB Rugged Black", price: 1650000, sku: "GMC-SSD-05-1TB" },
      { name: "2TB Rugged Black", price: 2950000, sku: "GMC-SSD-05-2TB" }
    ],
    specs: {
      "Kecepatan": "Hingga 1050 MB/s Read, 1000 MB/s Write",
      "Durabilitas": "IP55 tahan air, debu, dan jatuh dari ketinggian 2 meter"
    },
    description: "SSD eksternal tangguh berlapis silikon tahan benturan untuk fotografer dan videografer lapangan.",
    is_featured: false
  },
  {
    sku: "GMC-HDD-03",
    name: "Toshiba Canvio Basics 2.5 Inch USB 3.0 External",
    brand: "Toshiba",
    category: "hdd",
    price_idr: 780000,
    compare_at_price_idr: 880000,
    stock: 20,
    variants: [
      { name: "1TB Black", price: 780000, sku: "GMC-HDD-03-1TB" },
      { name: "2TB Black", price: 1150000, sku: "GMC-HDD-03-2TB" }
    ],
    specs: {
      "Ukuran": "2.5 inch Portable",
      "Koneksi": "USB 3.2 Gen 1 (Plug & Play)"
    },
    description: "Harddisk eksternal portabel ringkas dan terjangkau untuk backup data harian dokumen dan foto keluarga.",
    is_featured: false
  },
  {
    sku: "GMC-RAM-04",
    name: "SK hynix Platinum P41 / Gold P31 DDR5 Module 32GB",
    brand: "SK hynix",
    category: "ram",
    price_idr: 1850000,
    compare_at_price_idr: 2050000,
    stock: 12,
    variants: [
      { name: "32GB (2x16GB) 5600MHz", price: 1850000, sku: "GMC-RAM-04-32G" }
    ],
    specs: {
      "Die Type": "Original SK hynix A-Die",
      "Kecepatan": "5600 MT/s JEDEC Standard",
      "Stabilitas": "Kestabilan overclocking tinggi"
    },
    description: "Memori DDR5 berbasis chip SK hynix A-Die asli dengan potensi timing tuning terbaik bagi enthusiast.",
    is_featured: false
  },
  {
    sku: "GMC-NET-06",
    name: "D-Link DGS-1008A 8-Port Gigabit Desktop Switch",
    brand: "D-Link",
    category: "networking",
    price_idr: 280000,
    compare_at_price_idr: 320000,
    stock: 30,
    variants: [
      { name: "8-Port Gigabit", price: 280000, sku: "GMC-NET-06-8P" }
    ],
    specs: {
      "Port": "8x 10/100/1000 Mbps Gigabit RJ45",
      "Fitur": "D-Link Green Ethernet hemat daya"
    },
    description: "Switch jaringan tanpa kipas yang hening untuk menghubungkan PC, printer, dan smart TV kantor ke router.",
    is_featured: false
  },
  {
    sku: "GMC-NET-07",
    name: "Netgear Nighthawk Pro Gaming XR1000 WiFi 6 Router",
    brand: "Netgear",
    category: "networking",
    price_idr: 4950000,
    compare_at_price_idr: 5500000,
    stock: 5,
    variants: [
      { name: "AX5400 DumaOS 3.0", price: 4950000, sku: "GMC-NET-07-XR" }
    ],
    specs: {
      "Software": "DumaOS 3.0 khusus optimasi ping game online",
      "Kecepatan": "WiFi 6 AX5400 hingga 5.4 Gbps",
      "Fitur": "Geo-Filter & Ping Heatmap"
    },
    description: "Router gaming kelas turnamen dengan sistem operasi DumaOS untuk memangkas ping dan latensi game online.",
    is_featured: false
  },
  {
    sku: "GMC-NET-08",
    name: "Tenda TX2 Pro AX1500 Dual Band Gigabit Wi-Fi 6",
    brand: "Tenda",
    category: "networking",
    price_idr: 425000,
    compare_at_price_idr: 490000,
    stock: 25,
    variants: [
      { name: "AX1500 5 Antena", price: 425000, sku: "GMC-NET-08-TX2" }
    ],
    specs: {
      "Antena": "5x 6dBi High-Gain Antennas",
      "Standar": "Wi-Fi 6 OFDMA + MU-MIMO"
    },
    description: "Router Wi-Fi 6 paling hemat biaya dengan 5 antena penguat jangkauan sinyal tembus dinding rumah.",
    is_featured: false
  },
  {
    sku: "GMC-NET-09",
    name: "Mercusys Halo H80X AX3000 Whole Home Mesh (2-Pack)",
    brand: "Mercusys",
    category: "networking",
    price_idr: 1350000,
    compare_at_price_idr: 1550000,
    stock: 14,
    variants: [
      { name: "2-Pack Mesh AX3000", price: 1350000, sku: "GMC-NET-09-2PK" }
    ],
    specs: {
      "Kecepatan": "AX3000 (2402 Mbps di 5GHz + 574 Mbps di 2.4GHz)",
      "Roaming": "Seamless Roaming satu nama SSID Wi-Fi"
    },
    description: "Solusi mesh Wi-Fi 6 ramah kantong menghapus titik mati sinyal di rumah bertingkat tanpa jeda sambungan.",
    is_featured: false
  },
  {
    sku: "GMC-KBD-04",
    name: "Fantech MAXFIT81 Frost Wireless Mechanical Keyboard",
    brand: "Fantech",
    category: "keyboard",
    price_idr: 799000,
    compare_at_price_idr: 920000,
    stock: 15,
    variants: [
      { name: "Frost White / Outemu Red", price: 799000, sku: "GMC-KBD-04-RED" },
      { name: "Frost Black / Outemu Blue", price: 799000, sku: "GMC-KBD-04-BLU" }
    ],
    specs: {
      "Fitur": "OLED Smart Screen 1 inch interaktif + Rotary Knob volume",
      "Koneksi": "Tri-mode (Bluetooth, 2.4Ghz, Type-C)",
      "Mount": "Gasket Mount pengetikan empuk bersuara thock"
    },
    description: "Keyboard gasket mount dengan kenop putar volume dan layar mini OLED informatif yang bisa dipersonalisasi.",
    is_featured: false
  },
  {
    sku: "GMC-MOU-04",
    name: "HyperX Pulsefire Haste 2 Wireless Gaming Mouse",
    brand: "HyperX",
    category: "mouse",
    price_idr: 1199000,
    compare_at_price_idr: 1350000,
    stock: 16,
    variants: [
      { name: "Solid Shell Black 61g", price: 1199000, sku: "GMC-MOU-04-BLK" },
      { name: "Solid Shell White 61g", price: 1199000, sku: "GMC-MOU-04-WHT" }
    ],
    specs: {
      "Bobot": "61 gram solid shell tanpa lubang",
      "Baterai": "Hingga 100 jam pemakaian",
      "Sensor": "HyperX 26K Sensor"
    },
    description: "Mouse gaming nirkabel ringan berbodi padat tanpa lubang sarang lebah yang nyaman dibersihkan.",
    is_featured: false
  },
  {
    sku: "GMC-CAS-04",
    name: "Cooler Master MasterBox Q300L Micro-ATX Case",
    brand: "Cooler Master",
    category: "casing",
    price_idr: 685000,
    compare_at_price_idr: 760000,
    stock: 18,
    variants: [
      { name: "Black Micro-ATX", price: 685000, sku: "GMC-CAS-04-BLK" }
    ],
    specs: {
      "Filter": "Magnetic Dust Filters dengan pola geometris modern",
      "Orientasi": "Dapat diletakkan vertikal maupun horizontal",
      "Panel": "Acrylic edge-to-edge transparan"
    },
    description: "Casing Micro-ATX ringkas dengan filter debu magnetik bermotif modern yang fleksibel diposisikan.",
    is_featured: false
  },
  {
    sku: "GMC-PSU-04",
    name: "Thermaltake Toughpower GF3 850W PCIe 5.0 ATX 3.0",
    brand: "Thermaltake",
    category: "psu",
    price_idr: 2150000,
    compare_at_price_idr: 2350000,
    stock: 8,
    variants: [
      { name: "850W Gold Native 12VHPWR", price: 2150000, sku: "GMC-PSU-04-850" }
    ],
    specs: {
      "Daya": "850 Watt 80+ Gold",
      "Konektor": "Native 16-pin 12VHPWR PCIe 5.0",
      "Kapasitor": "100% Japanese 105°C Capacitors"
    },
    description: "PSU PCIe 5.0 bertenaga dengan kapasitor murni Jepang untuk suplai daya tanpa jeda kartu grafis RTX 40 series.",
    is_featured: false
  },
  {
    sku: "GMC-UPS-03",
    name: "Eaton 5E Gen2 900VA Line Interactive USB UPS",
    brand: "Eaton",
    category: "ups",
    price_idr: 1250000,
    compare_at_price_idr: 1390000,
    stock: 14,
    variants: [
      { name: "900VA / 480W USB HID", price: 1250000, sku: "GMC-UPS-03-900" }
    ],
    specs: {
      "Kapasitas": "900VA / 480 Watt",
      "Koneksi": "Port USB HID untuk auto-shutdown komputer aman",
      "Proteksi": "AVR voltase naik-turun dan surge data line"
    },
    description: "UPS tangguh merk Eaton asal Amerika dengan integrasi otomatis mematikan komputer tanpa kehilangan data.",
    is_featured: false
  },
  {
    sku: "GMC-MON-06",
    name: "Philips Evnia 27M1N3200Z 27 Inch 165Hz IPS Gaming",
    brand: "Philips",
    category: "monitor",
    price_idr: 2750000,
    compare_at_price_idr: 2990000,
    stock: 10,
    variants: [
      { name: "27 Inch FHD 165Hz IPS", price: 2750000, sku: "GMC-MON-06-27" }
    ],
    specs: {
      "Layar": "27 inch IPS Full HD 165Hz 1ms MPRT",
      "Warna": "Ultra Wide-Color 122% sRGB akurat",
      "Stand": "Desain Evnia elegan abu-abu modern"
    },
    description: "Monitor seri Evnia dengan desain arsitektur abu-abu bersih yang menyatu indah pada setup kerja minimalis.",
    is_featured: false
  }
];

// Generate CSV
const csvHeaders = "sku,name,brand,category,price_idr,compare_at_price_idr,stock,variants_json,specs_json,description,image_slugs,is_featured,is_demo\n";

const csvRows = PRODUCTS_DATA.map(p => {
  const variantsJson = JSON.stringify(p.variants).replace(/"/g, '""');
  const specsJson = JSON.stringify(p.specs).replace(/"/g, '""');
  const desc = p.description.replace(/"/g, '""');
  const imageSlugs = `/products/${p.sku}/1.svg,/products/${p.sku}/2.svg`;
  return `"${p.sku}","${p.name}","${p.brand}","${p.category}",${p.price_idr},${p.compare_at_price_idr || ''},${p.stock},"${variantsJson}","${specsJson}","${desc}","${imageSlugs}",${p.is_featured ? 'true' : 'false'},true`;
}).join('\n');

fs.writeFileSync(path.join(__dirname, '../db/seed/products.csv'), csvHeaders + csvRows, 'utf8');
console.log(`Generated db/seed/products.csv with ${PRODUCTS_DATA.length} products.`);

// Helper function to create clean SVG hardware placeholders
function generateSvgPrimary(product) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <rect width="800" height="800" fill="#F2EFE8"/>
  <g transform="translate(400, 360)">
    <!-- Architectural product frame -->
    <rect x="-180" y="-140" width="360" height="280" rx="4" fill="#E8E4DA" stroke="#DAD6CC" stroke-width="2"/>
    <circle cx="0" cy="0" r="64" fill="none" stroke="#111111" stroke-width="3" stroke-dasharray="6,6"/>
    <rect x="-24" y="-24" width="48" height="48" rx="2" fill="#111111"/>
    <!-- Subtle technical grid -->
    <line x1="-160" y1="-100" x2="160" y2="-100" stroke="#DAD6CC" stroke-width="1"/>
    <line x1="-160" y1="100" x2="160" y2="100" stroke="#DAD6CC" stroke-width="1"/>
    <line x1="-100" y1="-140" x2="-100" y2="140" stroke="#DAD6CC" stroke-width="1"/>
    <line x1="100" y1="-140" x2="100" y2="140" stroke="#DAD6CC" stroke-width="1"/>
  </g>
  <!-- Micro label brand & sku -->
  <text x="400" y="580" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="3" fill="#8B877E">${product.brand.toUpperCase()}</text>
  <text x="400" y="612" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" letter-spacing="-0.5" fill="#111111">${product.category.toUpperCase()} • ${product.sku}</text>
  <text x="400" y="640" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#5F5C55">GLOBAL MANDIRI COMPUTER</text>
</svg>`;
}

function generateSvgSecondary(product) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <rect width="800" height="800" fill="#EAE6DD"/>
  <!-- Soft lifestyle texture/grid -->
  <defs>
    <pattern id="grid-${product.sku}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DAD6CC" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="url(#grid-${product.sku})" opacity="0.6"/>
  <g transform="translate(400, 360)">
    <rect x="-200" y="-160" width="400" height="320" rx="8" fill="#FBF7EF" stroke="#111111" stroke-width="1.5"/>
    <text x="0" y="-40" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" letter-spacing="2" fill="#5F5C55">LIFESTYLE & DETAIL</text>
    <text x="0" y="10" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="600" letter-spacing="-1" fill="#111111">${product.brand}</text>
    <text x="0" y="50" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="400" fill="#5F5C55">ITC Mega Grosir Lt. 2 Blok B/7</text>
  </g>
  <text x="400" y="640" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" letter-spacing="3" fill="#8B877E">OFFICIAL BRAND WARRANTY</text>
</svg>`;
}

// Generate image directories and SVGs
PRODUCTS_DATA.forEach(p => {
  const dir = path.join(__dirname, `../web/public/products/${p.sku}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, '1.svg'), generateSvgPrimary(p), 'utf8');
  fs.writeFileSync(path.join(dir, '2.svg'), generateSvgSecondary(p), 'utf8');
});

console.log(`Generated SVG placeholder images for all ${PRODUCTS_DATA.length} products.`);

// Generate homepage category showcase and promo SVGs in public/placeholders
const placeholders = [
  { name: 'cat-pc.webp', title: 'PC & Komponen', code: 'PC' },
  { name: 'cat-laptop.webp', title: 'Laptop & Mobile', code: 'LAPTOP' },
  { name: 'cat-monitor.webp', title: 'Monitor & Proyektor', code: 'DISPLAY' },
  { name: 'cat-networking.webp', title: 'Networking & Starlink', code: 'NETWORK' },
  { name: 'cat-printer.webp', title: 'Printer & Aksesoris', code: 'PRINTER' },
  { name: 'cat-ups.webp', title: 'UPS & Audio', code: 'AUDIO' },
  { name: 'promo-pc.webp', title: 'PC Gaming & Rakitan', code: 'PROMO PC' },
  { name: 'promo-starlink.webp', title: 'Networking & Starlink', code: 'PROMO SAT' },
  { name: 'why-original.webp', title: 'Barang Original', code: 'ORIGINAL' },
  { name: 'why-stock.webp', title: 'Stok Siap ITC', code: 'ITC SURABAYA' },
  { name: 'why-consultation.webp', title: 'Konsultasi Rakit', code: 'KONSULTASI' },
  { name: 'why-price.webp', title: 'Harga Bersaing', code: 'HARGA JUJUR' },
  { name: 'why-aftersales.webp', title: 'Purna Jual', code: 'GARANSI' },
  { name: 'about-story.webp', title: 'Cerita GMC', code: 'OUR STORY' },
  { name: 'about-services.webp', title: 'Layanan GMC', code: 'SERVICES' },
  { name: 'about-brands.webp', title: 'Brand Mitra', code: 'PARTNERS' },
];

placeholders.forEach(item => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="100%" height="100%">
    <rect width="1200" height="900" fill="#F2EFE8"/>
    <defs>
      <pattern id="pat-${item.name}" width="60" height="60" patternUnits="userSpaceOnUse">
        <circle cx="30" cy="30" r="1.5" fill="#DAD6CC"/>
      </pattern>
    </defs>
    <rect width="1200" height="900" fill="url(#pat-${item.name})"/>
    <g transform="translate(600, 420)">
      <rect x="-240" y="-160" width="480" height="320" rx="4" fill="#FBF7EF" stroke="#DAD6CC" stroke-width="1.5"/>
      <text x="0" y="-30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" letter-spacing="4" fill="#8B877E">${item.code}</text>
      <text x="0" y="30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="500" letter-spacing="-1" fill="#111111">${item.title}</text>
      <text x="0" y="80" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="400" fill="#5F5C55">GLOBAL MANDIRI COMPUTER • SURABAYA</text>
    </g>
  </svg>`;
  // Write as SVG (Next.js can serve or render SVG directly or as fallback)
  const filePath = path.join(__dirname, '../web/public/placeholders', item.name.replace('.webp', '.svg'));
  fs.writeFileSync(filePath, svgContent, 'utf8');
});

console.log('Generated all editorial placeholders.');
