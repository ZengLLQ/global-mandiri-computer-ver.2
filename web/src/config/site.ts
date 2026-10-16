export interface BusinessConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  location: {
    mall: string;
    unit: string;
    city: string;
    province: string;
    fullAddress: string;
    googleMapsUrl: string;
  };
  contact: {
    whatsappNumber: string;
    whatsappDisplay: string;
    whatsappUrl: string;
    email: string;
    address?: string;
    phone?: string;
    openingHours?: string;
  };
  openingHours: string;
  credit: string;
  apiUrl: string;
}

export const siteConfig: BusinessConfig = {
  name: "Global Mandiri Computer",
  shortName: "GMC",
  tagline: "Pusat Hardware, Komputer Rakitan, & Solusi IT Terpercaya",
  description:
    "Toko spesialis komputer, komponen PC, laptop, networking, dan perlengkapan IT di ITC Mega Grosir Surabaya. Layanan konsultasi profesional, stok siap, dan konfirmasi WhatsApp mudah.",
  location: {
    mall: "ITC Mega Grosir",
    unit: "Lt. 2 Blok B/7",
    city: "Surabaya",
    province: "Jawa Timur",
    fullAddress: "ITC Mega Grosir Lt. 2 Blok B/7, Surabaya, Jawa Timur",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=ITC+Mega+Grosir+Surabaya",
  },
  contact: {
    whatsappNumber: "6282232554674",
    whatsappDisplay: "0822-3255-4674",
    whatsappUrl: "https://wa.me/6282232554674",
    email: "veneratesman@gmail.com",
    address: "ITC Mega Grosir Lt. 2 Blok B/7, Surabaya, Jawa Timur",
    phone: "0822-3255-4674",
    openingHours: "Senin – Sabtu, 09.00 – 17.00 WIB",
  },
  openingHours: "Senin – Sabtu, 09.00 – 17.00 WIB",
  credit: "Site by {{STUDIO_NAME}}",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
};

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

export const categoriesList = [
  { slug: "pc-rakitan", label: "PC Rakitan & Desktop", icon: "Cpu" },
  { slug: "laptop", label: "Laptop", icon: "Laptop" },
  { slug: "monitor", label: "Monitor", icon: "Monitor" },
  { slug: "processor", label: "Processor (CPU)", icon: "Cpu" },
  { slug: "motherboard", label: "Motherboard", icon: "CircuitBoard" },
  { slug: "gpu", label: "VGA / GPU", icon: "Layers" },
  { slug: "ram", label: "RAM", icon: "MemoryStick" },
  { slug: "ssd", label: "SSD", icon: "HardDrive" },
  { slug: "hdd", label: "HDD", icon: "Disc" },
  { slug: "psu", label: "Power Supply (PSU)", icon: "Zap" },
  { slug: "casing", label: "Casing", icon: "Box" },
  { slug: "fan", label: "Fan Casing", icon: "Fan" },
  { slug: "cooling", label: "CPU Cooler (Air & Water)", icon: "Snowflake" },
  { slug: "mouse", label: "Mouse", icon: "Mouse" },
  { slug: "keyboard", label: "Keyboard", icon: "Keyboard" },
  { slug: "speaker", label: "Speaker", icon: "Speaker" },
  { slug: "ups", label: "UPS", icon: "BatteryCharging" },
  { slug: "proyektor", label: "Proyektor", icon: "Projector" },
  { slug: "starlink", label: "Starlink", icon: "Satellite" },
  { slug: "networking", label: "Networking", icon: "Wifi" },
  { slug: "printer", label: "Printer", icon: "Printer" },
] as const;

export const brandList = [
  "ASUS", "MSI", "GIGABYTE", "ASRock", "Intel", "AMD", "NVIDIA", "Corsair",
  "G.Skill", "Kingston", "Crucial", "Samsung", "SK hynix", "WD", "Seagate",
  "Toshiba", "SanDisk", "Zotac", "Lian Li", "Fractal Design", "NZXT",
  "Cooler Master", "DeepCool", "Noctua", "be quiet!", "Thermaltake", "Seasonic",
  "FSP", "APC", "Eaton", "Prolink", "Logitech", "Razer", "SteelSeries", "HyperX",
  "Rexus", "Fantech", "Edifier", "Creative", "JBL", "Dell", "Lenovo", "Acer", "HP",
  "Apple", "LG", "BenQ", "ViewSonic", "AOC", "Philips", "Brother", "Epson",
  "Canon", "TP-Link", "Ubiquiti", "MikroTik", "D-Link", "Netgear", "Tenda",
  "Mercusys", "Starlink", "UGREEN", "Anker", "Vention", "XGIMI", "Optoma"
] as const;
