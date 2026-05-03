/**
 * Seed script — creates 450 vendor accounts with complete profiles and portfolios.
 *
 * Usage:  npm run seed:vendors
 *
 * Each vendor gets:
 *   - A user account (Better Auth) with role "vendor"
 *   - An organization (auto-created by Better Auth hook)
 *   - A fully populated vendor_profile (verified status)
 *   - 3-6 portfolio items with real image URLs
 *
 * Safe to run multiple times — skips vendors whose email already exists.
 * Password for all seeded vendors: 123123123
 */

import { pool } from "../config/db.js";
import { auth } from "../lib/auth.js";
import crypto from "crypto";

const VENDOR_PASSWORD = "123123123";
const BATCH_SIZE = 15;

// ---------------------------------------------------------------------------
// Ethiopian City Data (center-weighted)
// ---------------------------------------------------------------------------
interface City {
  name: string;
  lat: number;
  lng: number;
  weight: number; // higher = more vendors
}

const CITIES: City[] = [
  { name: "Addis Ababa",   lat: 9.0192,  lng: 38.7525,  weight: 35 },
  { name: "Adama",         lat: 8.5400,  lng: 39.2700,  weight: 8 },
  { name: "Bishoftu",      lat: 8.7500,  lng: 38.9800,  weight: 5 },
  { name: "Hawassa",       lat: 7.0621,  lng: 38.4763,  weight: 7 },
  { name: "Bahir Dar",     lat: 11.5742, lng: 37.3614,  weight: 6 },
  { name: "Jimma",         lat: 7.6667,  lng: 36.8333,  weight: 4 },
  { name: "Dire Dawa",     lat: 9.6000,  lng: 41.8500,  weight: 5 },
  { name: "Mekelle",       lat: 13.4967, lng: 39.4753,  weight: 4 },
  { name: "Gondar",        lat: 12.6000, lng: 37.4667,  weight: 4 },
  { name: "Dessie",        lat: 11.1333, lng: 39.6333,  weight: 3 },
  { name: "Shashamane",    lat: 7.2000,  lng: 38.5900,  weight: 3 },
  { name: "Woliso",        lat: 8.5350,  lng: 37.9780,  weight: 2 },
  { name: "Debre Berhan",  lat: 9.6800,  lng: 39.5200,  weight: 2 },
  { name: "Debre Markos",  lat: 10.3500, lng: 37.7333,  weight: 2 },
  { name: "Nekemte",       lat: 9.0900,  lng: 36.5400,  weight: 2 },
  { name: "Ambo",          lat: 8.9833,  lng: 37.8500,  weight: 2 },
  { name: "Arba Minch",    lat: 6.0333,  lng: 37.5500,  weight: 2 },
  { name: "Harar",         lat: 9.3100,  lng: 42.1200,  weight: 2 },
  { name: "Assela",        lat: 7.9500,  lng: 39.1200,  weight: 2 },
];

function buildWeightedCityPool(): City[] {
  const pool: City[] = [];
  for (const city of CITIES) {
    for (let i = 0; i < city.weight; i++) pool.push(city);
  }
  return pool;
}

function jitter(base: number, range = 0.02): number {
  return base + (Math.random() - 0.5) * range * 2;
}

// ---------------------------------------------------------------------------
// Service Categories & Pricing (Ethiopian Birr)
// ---------------------------------------------------------------------------
interface CategoryInfo {
  name: string;
  minPrice: number;
  maxPrice: number;
  descriptions: string[];
  portfolioImages: string[];
}

const CATEGORIES: CategoryInfo[] = [
  {
    name: "Photography",
    minPrice: 8000,
    maxPrice: 120000,
    descriptions: [
      "Professional wedding photography capturing every precious moment of your special day with artistic vision and state-of-the-art equipment.",
      "Award-winning photography studio specializing in Ethiopian wedding ceremonies, outdoor shoots, and candid moments that tell your love story.",
      "Full-day wedding photography coverage including engagement sessions, ceremony, reception, and a curated album of your best memories.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800",
    ],
  },
  {
    name: "Videography",
    minPrice: 15000,
    maxPrice: 200000,
    descriptions: [
      "Cinematic wedding videography that transforms your celebration into a timeless film with drone coverage and same-day edits.",
      "Creative wedding filmmakers delivering highlight reels, full ceremony coverage, and documentary-style wedding films.",
      "High-definition wedding video production including multi-camera setup, aerial footage, and professional color grading.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800",
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800",
      "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=800",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
      "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800",
      "https://images.unsplash.com/photo-1578328819058-b69f2a3a04a3?w=800",
    ],
  },
  {
    name: "Catering",
    minPrice: 25000,
    maxPrice: 800000,
    descriptions: [
      "Premium Ethiopian and international catering service offering traditional dishes, continental cuisine, and custom wedding menus for up to 1,000 guests.",
      "Full-service wedding catering with traditional Ethiopian buffet, live cooking stations, pastry bars, and professional waitstaff.",
      "Exquisite catering combining authentic Ethiopian flavors with modern presentation, perfect for wedding receptions of any size.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800",
    ],
  },
  {
    name: "Venue",
    minPrice: 30000,
    maxPrice: 1500000,
    descriptions: [
      "Elegant wedding venue with indoor and outdoor ceremony spaces, lush gardens, and banquet halls accommodating up to 800 guests.",
      "Stunning rooftop and garden wedding venue in the heart of the city with panoramic views, modern amenities, and flexible event packages.",
      "Luxurious wedding hall featuring grand ballrooms, bridal suites, ample parking, and dedicated event coordination.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800",
      "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800",
      "https://images.unsplash.com/photo-1431540015159-0f9673be25e0?w=800",
    ],
  },
  {
    name: "DJ/Music",
    minPrice: 5000,
    maxPrice: 80000,
    descriptions: [
      "Professional DJ and live music entertainment for weddings, featuring Ethiopian hits, international tracks, and customized playlists.",
      "High-energy wedding DJ service with premium sound systems, lighting effects, and MC services to keep your guests dancing all night.",
      "Live band and DJ combo specializing in Ethiopian wedding music including Eskista, cultural dances, and modern favorites.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
      "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800",
    ],
  },
  {
    name: "Decoration",
    minPrice: 10000,
    maxPrice: 350000,
    descriptions: [
      "Transform your wedding venue into a breathtaking wonderland with custom floral arrangements, drapery, lighting design, and themed decor.",
      "Full-service wedding decoration including stage design, table settings, balloon art, and culturally inspired Ethiopian wedding aesthetics.",
      "Creative wedding styling and decoration with modern and traditional Ethiopian themes, from intimate gatherings to grand celebrations.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800",
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800",
      "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800",
      "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800",
      "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800",
    ],
  },
  {
    name: "Bridal Wear",
    minPrice: 5000,
    maxPrice: 150000,
    descriptions: [
      "Exclusive bridal wear boutique offering custom-designed Ethiopian traditional wedding dresses, modern gowns, and groom's attire.",
      "Elegant wedding dress collection featuring habesha kemis, contemporary bridal gowns, and complete bridal party outfitting.",
      "Bespoke bridal fashion combining Ethiopian cultural elegance with modern trends, including fittings, alterations, and accessories.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800",
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800",
      "https://images.unsplash.com/photo-1519657337289-077653f724ed?w=800",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
      "https://images.unsplash.com/photo-1549416878-b7066d0b3a45?w=800",
      "https://images.unsplash.com/photo-1518609571773-39b7d303a87b?w=800",
    ],
  },
  {
    name: "Makeup/Beauty",
    minPrice: 3000,
    maxPrice: 60000,
    descriptions: [
      "Professional bridal makeup and beauty services including hairstyling, skincare prep, and complete glam packages for the wedding party.",
      "Expert makeup artists specializing in Ethiopian bridal looks, from natural elegance to glamorous transformations with long-lasting results.",
      "Complete bridal beauty package with pre-wedding skincare, trial sessions, wedding day makeup, and touch-up services throughout the event.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800",
      "https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800",
    ],
  },
  {
    name: "Florist",
    minPrice: 4000,
    maxPrice: 100000,
    descriptions: [
      "Artisan floral design studio creating stunning bridal bouquets, centerpieces, altar arrangements, and venue floral installations.",
      "Fresh flower arrangements for weddings using locally sourced Ethiopian roses, tropical blooms, and imported exotic flowers.",
      "Full floral service from bridal bouquets and boutonnieres to elaborate ceremony arches, table runners, and reception decor.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800",
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800",
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800",
      "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800",
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800",
      "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800",
    ],
  },
  {
    name: "Event Planning",
    minPrice: 20000,
    maxPrice: 500000,
    descriptions: [
      "End-to-end wedding planning and coordination services managing every detail from venue selection to the last dance of the evening.",
      "Experienced wedding planners delivering seamless celebrations with vendor coordination, timeline management, and on-the-day direction.",
      "Comprehensive wedding planning including budget management, vendor sourcing, design concept, and full event execution.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
    ],
  },
  {
    name: "Transportation",
    minPrice: 5000,
    maxPrice: 80000,
    descriptions: [
      "Luxury wedding transportation fleet including decorated limousines, classic cars, and modern SUVs for the bridal party and guests.",
      "Premium wedding car rental with professional chauffeurs, vehicle decoration, and coordinated convoy services for your big day.",
      "Complete wedding transport solutions from bridal car to guest shuttles, featuring well-maintained luxury vehicles and punctual service.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
    ],
  },
  {
    name: "Cake/Pastry",
    minPrice: 3000,
    maxPrice: 80000,
    descriptions: [
      "Custom wedding cake design and artisan pastry services with flavors ranging from traditional Ethiopian honey cake to French patisserie.",
      "Stunning multi-tier wedding cakes, dessert tables, and sweet treats crafted with premium ingredients and artistic decoration.",
      "Bespoke wedding cake studio creating edible masterpieces from classic tiered cakes to modern minimalist designs and themed confections.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800",
      "https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=800",
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800",
      "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
      "https://images.unsplash.com/photo-1525742907711-0657c37c4b6f?w=800",
    ],
  },
  {
    name: "Invitation/Printing",
    minPrice: 2000,
    maxPrice: 40000,
    descriptions: [
      "Elegant wedding invitation design and printing services with options ranging from traditional Ethiopian motifs to contemporary minimalism.",
      "Custom wedding stationery suite including save-the-dates, invitations, programs, menu cards, and thank-you notes with Amharic and English.",
      "Premium print studio specializing in wedding invitations with letterpress, foil stamping, and digital printing in bespoke designs.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800",
      "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800",
      "https://images.unsplash.com/photo-1528825871115-3581a5e31013?w=800",
    ],
  },
  {
    name: "Jewelry",
    minPrice: 5000,
    maxPrice: 200000,
    descriptions: [
      "Handcrafted Ethiopian wedding jewelry including engagement rings, wedding bands, and traditional gold accessories with contemporary flair.",
      "Fine jewelry boutique offering custom-designed wedding rings, bridal sets, and Ethiopian cultural jewelry in gold, silver, and gemstones.",
      "Exquisite wedding jewelry collection featuring handmade Ethiopian designs, diamond settings, and personalized engraving services.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1515562141589-67f0d569b46f?w=800",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
      "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
      "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=800",
    ],
  },
  {
    name: "Lighting/Sound",
    minPrice: 8000,
    maxPrice: 150000,
    descriptions: [
      "Professional wedding lighting and sound engineering services transforming any venue with atmospheric uplighting, moving heads, and crystal-clear audio.",
      "Complete lighting and PA system rental for weddings with installation, operation, and teardown handled by experienced technicians.",
      "Dramatic wedding ambiance through intelligent lighting design, haze effects, gobos, and concert-grade sound systems for ceremonies and receptions.",
    ],
    portfolioImages: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
      "https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=800",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    ],
  },
];

// ---------------------------------------------------------------------------
// Ethiopian Names (masculine and feminine for business owners)
// ---------------------------------------------------------------------------
const FIRST_NAMES = [
  "Abebe", "Alemayehu", "Amanuel", "Bereket", "Biniam", "Biruk", "Dagmawi",
  "Daniel", "Dawit", "Ermias", "Eyob", "Fasil", "Fikru", "Getachew", "Girma",
  "Habtamu", "Henok", "Kaleab", "Kebede", "Kidane", "Lema", "Mekonen",
  "Mesfin", "Mulugeta", "Nahom", "Robel", "Samuel", "Seyoum", "Solomon",
  "Tadesse", "Tariku", "Taye", "Tekle", "Temesgen", "Tesfaye", "Tsegaye",
  "Yared", "Yohannes", "Yonas", "Zerihun",
  "Abeba", "Almaz", "Asnakech", "Bezawit", "Bethlehem", "Bruktawit",
  "Dagmawit", "Eden", "Eleni", "Eyerusalem", "Feven", "Firehiwot",
  "Gelila", "Hanna", "Helen", "Hirut", "Kidist", "Liya", "Mahlet",
  "Meron", "Meseret", "Mihret", "Nardos", "Rahel", "Ruth", "Sara",
  "Selamawit", "Selam", "Tigist", "Tsehay", "Yeshi", "Yordanos", "Zewditu",
];

const LAST_NAMES = [
  "Abate", "Alemu", "Asfaw", "Assefa", "Ayele", "Balcha", "Baye", "Bekele",
  "Belay", "Bogale", "Debebe", "Demeke", "Desta", "Endale", "Eshetu",
  "Gebre", "Gebremedhin", "Haile", "Hailemariam", "Kebede", "Kiros",
  "Lemma", "Mekonnen", "Mengistu", "Molla", "Mulatu", "Negash", "Seyoum",
  "Tadesse", "Tekle", "Tesfaye", "Tilahun", "Wolde", "Worku", "Yilma",
  "Zewde", "Zerihun", "Gebru", "Teshome", "Getahun", "Admasu", "Birru",
  "Chala", "Dagne", "Fanta", "Gizaw", "Habte", "Jebessa", "Kitaw", "Lakew",
];

// ---------------------------------------------------------------------------
// Business name patterns
// ---------------------------------------------------------------------------
const BUSINESS_PREFIXES = [
  "", "", "", "Selam", "Habesha", "Meskel", "Timket", "Addis", "Abyssinia",
  "Lalibela", "Axum", "Sheba", "Entoto", "Bole", "Lucy", "Zion",
  "Blue Nile", "Rift Valley", "Merkato", "Piazza", "Tana", "Langano",
  "Arba Minch", "Gonder", "Simien",
];

const BUSINESS_SUFFIXES: Record<string, string[]> = {
  "Photography":        ["Studios", "Photo", "Captures", "Lens", "Frames", "Imagery", "Photography", "Clicks"],
  "Videography":        ["Films", "Productions", "Cinematic", "Motion", "Media", "Visuals", "Stories"],
  "Catering":           ["Catering", "Kitchen", "Feast", "Cuisine", "Foods", "Banquet", "Dining"],
  "Venue":              ["Hall", "Gardens", "Resort", "Palace", "Center", "Estate", "Venue", "Lodge"],
  "DJ/Music":           ["Entertainment", "Beats", "Sound", "Music", "Vibes", "Rhythm", "Audio"],
  "Decoration":         ["Decor", "Designs", "Styling", "Creations", "Aesthetics", "Events", "Art"],
  "Bridal Wear":        ["Bridal", "Fashion", "Couture", "Boutique", "Attire", "Elegance", "Dress"],
  "Makeup/Beauty":      ["Beauty", "Glam", "Artistry", "Cosmetics", "Looks", "Salon", "Studio"],
  "Florist":            ["Flowers", "Blooms", "Florals", "Petals", "Garden", "Bouquet", "Roses"],
  "Event Planning":     ["Events", "Planning", "Celebrations", "Occasions", "Weddings", "Coordination"],
  "Transportation":     ["Transport", "Rides", "Cars", "Limousine", "Fleet", "Drive", "Motors"],
  "Cake/Pastry":        ["Cakes", "Bakery", "Pastry", "Sweets", "Confections", "Bakes", "Desserts"],
  "Invitation/Printing":["Print", "Press", "Cards", "Design", "Stationery", "Prints", "Graphics"],
  "Jewelry":            ["Jewelry", "Gems", "Gold", "Jewelers", "Rings", "Ornaments", "Crafts"],
  "Lighting/Sound":     ["Lighting", "Sound", "AV", "Tech", "Stage", "Production", "Systems"],
};

const SOCIAL_PLATFORMS = ["instagram", "telegram", "tiktok", "facebook"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateBusinessName(category: string, index: number): string {
  const prefix = pick(BUSINESS_PREFIXES);
  const suffixes = BUSINESS_SUFFIXES[category] ?? ["Service"];
  const suffix = pick(suffixes);
  if (prefix) {
    return `${prefix} ${suffix}`;
  }
  const ownerFirst = pick(FIRST_NAMES);
  const ownerLast = pick(LAST_NAMES);
  const patterns = [
    `${ownerFirst}'s ${suffix}`,
    `${ownerFirst} & ${pick(FIRST_NAMES)} ${suffix}`,
    `${ownerLast} ${suffix}`,
    `${ownerFirst} ${ownerLast} ${suffix}`,
  ];
  return patterns[index % patterns.length];
}

function generatePhone(index: number): string {
  const prefix = pick(["91", "92", "93", "94", "95", "96", "97", "98"]);
  const num = String(10000000 + index).slice(-7);
  return `+251${prefix}${num}`;
}

function generateSocialMedia(businessName: string): Record<string, string> {
  const handle = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 20);
  const count = randInt(1, 4);
  const platforms = pickN(SOCIAL_PLATFORMS, count);
  const result: Record<string, string> = {};
  for (const p of platforms) {
    result[p] = `@${handle}_${p === "telegram" ? "et" : ""}`.replace(/_$/, "");
  }
  return result;
}

// ---------------------------------------------------------------------------
// Related category groups — vendors offering multiple services pick from these
// ---------------------------------------------------------------------------
const RELATED_CATEGORIES: Record<string, string[]> = {
  "Photography":         ["Videography", "Lighting/Sound"],
  "Videography":         ["Photography", "Lighting/Sound"],
  "Catering":            ["Cake/Pastry", "Venue"],
  "Venue":               ["Decoration", "Catering", "Lighting/Sound"],
  "DJ/Music":            ["Lighting/Sound", "Event Planning"],
  "Decoration":          ["Florist", "Lighting/Sound", "Venue"],
  "Bridal Wear":         ["Makeup/Beauty", "Jewelry"],
  "Makeup/Beauty":       ["Bridal Wear", "Jewelry"],
  "Florist":             ["Decoration", "Event Planning"],
  "Event Planning":      ["Decoration", "Florist", "Transportation"],
  "Transportation":      ["Event Planning"],
  "Cake/Pastry":         ["Catering", "Invitation/Printing"],
  "Invitation/Printing": ["Event Planning", "Decoration"],
  "Jewelry":             ["Bridal Wear", "Makeup/Beauty"],
  "Lighting/Sound":      ["DJ/Music", "Decoration", "Venue"],
};

function getCategoryInfo(name: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.name === name);
}

// ---------------------------------------------------------------------------
// Build vendor list (450 vendors)
// ---------------------------------------------------------------------------
interface PortfolioGroup {
  categoryName: string;
  images: string[];
}

interface VendorSeed {
  index: number;
  email: string;
  name: string;
  businessName: string;
  primaryCategory: CategoryInfo;
  allCategoryNames: string[];
  portfolioGroups: PortfolioGroup[];
  city: City;
  phone: string;
  description: string;
  priceMin: number;
  priceMax: number;
  yearsOfExperience: number;
  socialMedia: Record<string, string>;
  rating: number;
  reviewCount: number;
}

function buildVendorList(count: number): VendorSeed[] {
  const cityPool = buildWeightedCityPool();
  const vendors: VendorSeed[] = [];
  const vendorsPerCategory = Math.ceil(count / CATEGORIES.length);

  for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
    const cat = CATEGORIES[catIdx];
    const categoryCount = catIdx < count % CATEGORIES.length
      ? vendorsPerCategory
      : Math.floor(count / CATEGORIES.length);

    for (let j = 0; j < categoryCount; j++) {
      const globalIndex = vendors.length;
      if (globalIndex >= count) break;

      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const city = pick(cityPool);
      const businessName = generateBusinessName(cat.name, globalIndex);
      const priceSpread = randFloat(0.3, 0.9);
      const priceMin = Math.round(cat.minPrice + (cat.maxPrice - cat.minPrice) * randFloat(0, 0.4));
      const priceMax = Math.round(priceMin + (cat.maxPrice - priceMin) * priceSpread);

      // ~40% of vendors offer 2-3 services (multi-category with portfolio tabs)
      const allCategoryNames: string[] = [cat.name];
      const portfolioGroups: PortfolioGroup[] = [];

      // Primary category portfolio: 3-5 images
      const primaryImgCount = randInt(3, 5);
      portfolioGroups.push({
        categoryName: cat.name,
        images: pickN(cat.portfolioImages, Math.min(primaryImgCount, cat.portfolioImages.length)),
      });

      if (Math.random() < 0.4) {
        const related = RELATED_CATEGORIES[cat.name] ?? [];
        const extraCount = randInt(1, Math.min(2, related.length));
        const extras = pickN(related, extraCount);
        for (const extraName of extras) {
          const extraCat = getCategoryInfo(extraName);
          if (extraCat) {
            allCategoryNames.push(extraName);
            const extraImgCount = randInt(2, 4);
            portfolioGroups.push({
              categoryName: extraName,
              images: pickN(extraCat.portfolioImages, Math.min(extraImgCount, extraCat.portfolioImages.length)),
            });
          }
        }
      }

      vendors.push({
        index: globalIndex,
        email: `vendor${globalIndex + 1}@twedar.seed`,
        name: `${firstName} ${lastName}`,
        businessName,
        primaryCategory: cat,
        allCategoryNames,
        portfolioGroups,
        city,
        phone: generatePhone(globalIndex),
        description: pick(cat.descriptions),
        priceMin,
        priceMax: Math.max(priceMax, priceMin + 1000),
        yearsOfExperience: randInt(1, 20),
        socialMedia: generateSocialMedia(businessName),
        rating: randFloat(3.0, 5.0),
        reviewCount: randInt(5, 120),
      });
    }
  }

  return vendors.slice(0, count);
}

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------
async function updateExistingVendor(vendor: VendorSeed, userId: string, tag: string): Promise<boolean> {
  // Find the vendor profile
  const profileResult = await pool.query(
    `SELECT id, business_name FROM vendor_profiles WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (profileResult.rows.length === 0) {
    console.log(`   ${tag} ⚠  No vendor profile found for ${vendor.email}, skipping update`);
    return false;
  }
  const profileId = profileResult.rows[0].id as string;
  const bName = profileResult.rows[0].business_name as string;

  // Update category array on the profile
  await pool.query(
    `UPDATE vendor_profiles SET category = $1 WHERE id = $2`,
    [JSON.stringify(vendor.allCategoryNames), profileId],
  );
  console.log(`   ${tag} ✓ Updated categories: ${vendor.allCategoryNames.join(", ")}`);

  // Delete old portfolio items and re-insert with proper per-category grouping
  const { rowCount: deleted } = await pool.query(
    `DELETE FROM vendor_portfolio_items WHERE vendor_profile_id = $1`,
    [profileId],
  );
  console.log(`   ${tag} ✓ Removed ${deleted ?? 0} old portfolio items`);

  let totalImages = 0;
  for (const group of vendor.portfolioGroups) {
    for (let i = 0; i < group.images.length; i++) {
      const itemId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO vendor_portfolio_items
           (id, vendor_profile_id, category, media_url, media_type, caption, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          itemId,
          profileId,
          group.categoryName,
          group.images[i],
          "image",
          `${bName} — ${group.categoryName} showcase ${i + 1}`,
          i,
        ],
      );
      totalImages++;
    }
  }
  const tabSummary = vendor.portfolioGroups.map((g) => `${g.categoryName}(${g.images.length})`).join(", ");
  console.log(`   ${tag} ✓ Portfolio: ${totalImages} images in ${vendor.portfolioGroups.length} tab(s) [${tabSummary}]`);
  console.log(`   ${tag} ✅ UPDATED — ${bName}\n`);

  return true;
}

async function createVendor(vendor: VendorSeed): Promise<"created" | "updated" | "failed"> {
  const tag = `[#${vendor.index + 1}]`;

  const existing = await pool.query(
    'SELECT id FROM "user" WHERE email = $1',
    [vendor.email],
  );
  if (existing.rows.length > 0) {
    console.log(`   ${tag} 🔄 ${vendor.email} — exists, updating categories & portfolio...`);
    const ok = await updateExistingVendor(vendor, existing.rows[0].id, tag);
    return ok ? "updated" : "failed";
  }

  // 1. Create user via Better Auth (hook sets role + creates org automatically)
  console.log(`   ${tag} 👤 Creating user ${vendor.name} (${vendor.email})...`);
  const ctx = await auth.api.signUpEmail({
    body: {
      name: vendor.name,
      email: vendor.email,
      password: VENDOR_PASSWORD,
      accountType: "vendor",
    },
  });

  if (!ctx?.user?.id) {
    console.error(`   ${tag} ✗ Failed to create user for ${vendor.email}`);
    return "failed";
  }

  const userId = ctx.user.id;
  console.log(`   ${tag} ✓ User created (${userId})`);

  // 2. Mark email as verified (Better Auth + admin level)
  await pool.query(
    `UPDATE "user" SET "emailVerified" = true WHERE id = $1`,
    [userId],
  );
  console.log(`   ${tag} ✓ Email verified`);

  // 3. Insert vendor_profile with full data and verified status
  const profileId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO vendor_profiles
       (id, user_id, business_name, category, description, phone_number,
        location, latitude, longitude, price_range_min, price_range_max,
        portfolio, years_of_experience, social_media, status, rating, review_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      profileId,
      userId,
      vendor.businessName,
      JSON.stringify(vendor.allCategoryNames),
      vendor.description,
      vendor.phone,
      vendor.city.name,
      jitter(vendor.city.lat),
      jitter(vendor.city.lng),
      vendor.priceMin,
      vendor.priceMax,
      JSON.stringify([]),
      vendor.yearsOfExperience,
      JSON.stringify(vendor.socialMedia),
      "verified",
      vendor.rating,
      vendor.reviewCount,
    ],
  );
  console.log(`   ${tag} ✓ Profile: "${vendor.businessName}" | ${vendor.allCategoryNames.join(", ")} | ${vendor.city.name} | ${vendor.priceMin.toLocaleString()}-${vendor.priceMax.toLocaleString()} ETB`);

  // 4. Insert portfolio items per category (each category = separate tab)
  let totalImages = 0;
  for (const group of vendor.portfolioGroups) {
    for (let i = 0; i < group.images.length; i++) {
      const itemId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO vendor_portfolio_items
           (id, vendor_profile_id, category, media_url, media_type, caption, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          itemId,
          profileId,
          group.categoryName,
          group.images[i],
          "image",
          `${vendor.businessName} — ${group.categoryName} showcase ${i + 1}`,
          i,
        ],
      );
      totalImages++;
    }
  }
  const tabSummary = vendor.portfolioGroups.map((g) => `${g.categoryName}(${g.images.length})`).join(", ");
  console.log(`   ${tag} ✓ Portfolio: ${totalImages} images in ${vendor.portfolioGroups.length} tab(s) [${tabSummary}]`);

  // 5. Update the organization name to match the business name
  await pool.query(
    `UPDATE "organization" SET name = $1 WHERE slug = $2`,
    [vendor.businessName, `vendor-${userId}`],
  );
  console.log(`   ${tag} ✓ Org renamed to "${vendor.businessName}"`);
  console.log(`   ${tag} ✅ CREATED — ${vendor.businessName}\n`);

  return "created";
}

async function seed() {
  const TOTAL = 450;
  const startTime = Date.now();
  console.log(`\n🌱 Seeding ${TOTAL} vendor accounts...`);
  console.log(`   Batch size: ${BATCH_SIZE} | Categories: ${CATEGORIES.length} | Cities: ${CITIES.length}\n`);

  const vendors = buildVendorList(TOTAL);
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < vendors.length; i += BATCH_SIZE) {
    const batchStart = Date.now();
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(vendors.length / BATCH_SIZE);
    console.log(`\n━━━ Batch ${batchNum}/${totalBatches} ━━━`);

    const batch = vendors.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((v) => createVendor(v)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value === "created") created++;
        else if (result.value === "updated") updated++;
        else failed++;
      } else {
        failed++;
        console.error(`   ✗ Error: ${result.reason}`);
      }
    }

    const progress = Math.min(i + BATCH_SIZE, vendors.length);
    const pct = ((progress / vendors.length) * 100).toFixed(0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const batchTime = ((Date.now() - batchStart) / 1000).toFixed(1);
    const avgPerVendor = (Date.now() - startTime) / progress / 1000;
    const remaining = ((vendors.length - progress) * avgPerVendor).toFixed(0);

    console.log(
      `   📊 [${pct}%] ${progress}/${vendors.length} | ✅ ${created} created | 🔄 ${updated} updated | ❌ ${failed} failed`,
    );
    console.log(
      `   ⏱  Batch: ${batchTime}s | Elapsed: ${elapsed}s | ETA: ~${remaining}s`,
    );
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Total: ${vendors.length}`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated (categories + portfolio): ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\n   Primary category distribution:`);

  const catCounts: Record<string, number> = {};
  for (const v of vendors) {
    catCounts[v.primaryCategory.name] = (catCounts[v.primaryCategory.name] ?? 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat}: ${count}`);
  }

  const multiCat = vendors.filter((v) => v.allCategoryNames.length > 1);
  console.log(`\n   Multi-service vendors: ${multiCat.length}/${vendors.length} (${((multiCat.length / vendors.length) * 100).toFixed(0)}%)`);
  const totalPortfolioImages = vendors.reduce((sum, v) => sum + v.portfolioGroups.reduce((s, g) => s + g.images.length, 0), 0);
  const totalTabs = vendors.reduce((sum, v) => sum + v.portfolioGroups.length, 0);
  console.log(`   Total portfolio tabs: ${totalTabs} | Total images: ${totalPortfolioImages}`);

  console.log(`\n   City distribution (top 10):`);
  const cityCounts: Record<string, number> = {};
  for (const v of vendors) {
    cityCounts[v.city.name] = (cityCounts[v.city.name] ?? 0) + 1;
  }
  for (const [city, count] of Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`     ${city}: ${count}`);
  }

  console.log(`\n   Login: any vendor email (vendor1@twedar.seed ... vendor${TOTAL}@twedar.seed)`);
  console.log(`   Password: ${VENDOR_PASSWORD}\n`);

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end().then(() => process.exit(1));
});
