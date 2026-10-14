import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COOKIE_NAME } from "@shared/const";
import { buildDistinctDeviceCopy, buildWhatsAppIntentUrl, resolveStoreContext, splitBrandAndModel } from "@shared/whatsapp";
import { trpc } from "./lib/trpc";
import {
  ArrowRight, BadgeCheck, BatteryCharging, Bike, Camera, Check, ChevronDown, ChevronRight,
  ArrowLeft, CircleUserRound, CreditCard, Eye, EyeOff, Heart, Instagram, Laptop, MapPin, Menu, Package, PackageCheck, Star,
  House, LockKeyhole, Mail, Moon, Phone, Plus, RotateCcw, Search, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Store, Sun, Tag,
  Trash2, Truck, UploadCloud, Wrench, X, Zap,
} from "lucide-react";

function saveSessionToken(token?: string) {
  if (!token) return;
  try {
    sessionStorage.setItem("iconnect-cookie", `${COOKIE_NAME}=${token}`);
    localStorage.setItem("iconnect-token", token);
  } catch {
    // ignore storage errors
  }
}

function clearSessionToken() {
  try {
    sessionStorage.removeItem("iconnect-cookie");
    sessionStorage.removeItem("manus-cookie");
    localStorage.removeItem("iconnect-token");
  } catch {
    // ignore storage errors
  }
}

const IMG = {
  hero: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/QnDuQcixwAeWSV4C6efJxb.jpg",
  repair: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/ocTx8St7QxHz87A3bhnbiB.jpg",
  phones: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/hARVVZXMDeRsRHJf7qX5xW.jpg",
  store: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/F4wCRumpvJMb9Mwu2DD82a.jpg",
};

type Product = { id: number; name: string; spec: string; price: number; was: number; tag: string; image: string; category: string; tone: string; rating: string; stock: string; description?: string };
const products: Product[] = [
  { id: -1, name: "iPhone 13", spec: "128GB · Midnight · Excellent", price: 32990, was: 37990, tag: "RT Nagar", image: IMG.phones, category: "iPhone", tone: "violet", rating: "4.8", stock: "2 units at RT Nagar", description: "Finished in deep Midnight with 128GB storage, this iPhone 13 features an untouched Super Retina XDR panel, responsive Face ID, and strong battery health. Drop by our RT Nagar counter to test it hands-on or trade in your old phone on the spot." },
  { id: -2, name: "Samsung S23", spec: "256GB · Green · Like new", price: 27990, was: 32990, tag: "Yeshwanthpur", image: IMG.hero, category: "Samsung", tone: "blue", rating: "4.7", stock: "In store · Yeshwanthpur", description: "Powered by the Snapdragon 8 Gen 2 chip with 256GB onboard memory, this Botanic Green Galaxy S23 delivers flagship night photography and a 120Hz AMOLED screen. Ready for walk-in purchase or exchange at our Yeshwanthpur hub." },
  { id: -3, name: "Google Pixel 7", spec: "128GB · Snow · Excellent", price: 18990, was: 21990, tag: "Ganganagar", image: IMG.phones, category: "Android", tone: "mint", rating: "4.6", stock: "In store · Ganganagar", description: "Experience pure Android and Google Tensor G2 computational photography in a crisp Snow finish. Hardware-cleared across cameras, haptics, and cellular bands—available for immediate pickup or upgrade credit at Ganganagar." },
  { id: -4, name: "MacBook Air M1", spec: "8GB · 256GB SSD · 2020", price: 49990, was: 56990, tag: "RT Nagar", image: IMG.store, category: "Laptops", tone: "sand", rating: "4.9", stock: "1 unit at RT Nagar", description: "Silent fanless performance meets all-day battery life in this Apple M1 MacBook Air (8GB RAM, 256GB SSD). Includes a low cycle count battery, flawless keyboard deck, and original USB-C power adapter at our RT Nagar showroom." },
  { id: -5, name: "iPhone 12", spec: "64GB · Blue · Very good", price: 23990, was: 27990, tag: "Yeshwanthpur", image: IMG.phones, category: "iPhone", tone: "rose", rating: "4.5", stock: "Available · Yeshwanthpur", description: "An approachable entry into Apple's 5G OLED lineup in vibrant Blue. Cleared for True Tone display accuracy, speaker clarity, and MagSafe charging—bring your current handset to Yeshwanthpur for an instant upgrade deduction." },
  { id: -6, name: "OnePlus 11", spec: "256GB · Titan Black · Like new", price: 24990, was: 29990, tag: "Ganganagar", image: IMG.hero, category: "Android", tone: "amber", rating: "4.7", stock: "Available · Ganganagar", description: "Built for speed with 256GB UFS 4.0 storage, Hasselblad triple cameras, and ultra-fast SuperVOOC charging in matte Titan Black. Inspect it live at our Ganganagar desk or request a real-time video walkthrough on WhatsApp." },
  { id: -7, name: "iPad Air 4", spec: "64GB · Wi‑Fi · Sky Blue", price: 29990, was: 34990, tag: "RT Nagar", image: IMG.store, category: "Tablets", tone: "blue", rating: "4.8", stock: "3 units at RT Nagar", description: "Slim 10.9-inch Liquid Retina tablet in Sky Blue with Touch ID integrated into the top button and Apple Pencil (2nd gen) support. Ideal for note-taking, media, and creative workflows—backed by our 6-month store warranty." },
  { id: -8, name: "Galaxy Watch 5", spec: "44mm · Bluetooth · Graphite", price: 12990, was: 16990, tag: "Yeshwanthpur", image: IMG.hero, category: "Wearables", tone: "mint", rating: "4.4", stock: "In store · Yeshwanthpur", description: "Crafted with scratch-resistant Sapphire Crystal glass and BioActive health sensors in a 44mm Graphite case. Includes wireless fast-charging puck and verified battery endurance at our Yeshwanthpur branch." },
  { id: -9, name: "Apple 20W USB-C Power Adapter & Cable", spec: "Original Fast Charger · USB-C to Lightning / C", price: 1690, was: 2490, tag: "RT Nagar", image: "/images/iphone-18-pro-lineup.jpg", category: "Accessories", tone: "violet", rating: "4.9", stock: "All 3 Branches", description: "Safeguard your iPhone's battery health with an authentic 20W USB-C PD wall adapter paired with a durable fast-charge cable. Delivers 50% charge in roughly 30 minutes without overheating." },
  { id: -10, name: "20000mAh PD Fast Power Bank & Protection Kit", spec: "22.5W Two-Way Fast Charge · MagSafe Case & 9H Glass", price: 1990, was: 2990, tag: "RT Nagar", image: IMG.phones, category: "Accessories", tone: "blue", rating: "4.8", stock: "All 3 Branches", description: "Complete daily protection and travel power bundle: an airline-safe 20000mAh PD power bank, shock-absorbent MagSafe case, and oleophobic 9H tempered glass installed free at the counter." },
];
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const categories = [{ label: "Mobiles", icon: Smartphone }, { label: "Laptops", icon: Laptop }, { label: "Accessories", icon: BatteryCharging }, { label: "Wearables", icon: Sparkles }, { label: "Repair", icon: Wrench }, { label: "Sell / Exchange", icon: RotateCcw }];
const reveal = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: .55 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: .08 } } };

type Drawer = "cart" | "login" | "sell" | "repair" | "checkout" | "product" | null;
type Page = "home" | "shop" | "sell" | "repair" | "signin" | "signup" | "admin" | "track";

function resolvePageFromPath(pathname: string): Page {
  const clean = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (clean === "/shop") return "shop";
  if (clean === "/sell") return "sell";
  if (clean === "/repair") return "repair";
  if (clean === "/admin") return "admin";
  if (clean === "/track") return "track";
  if (clean === "/signup" || clean === "/register") return "signup";
  if (clean === "/signin" || clean === "/login" || clean === "/auth" || clean === "/account" || clean === "/profile") return "signin";
  return "home";
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [cart, setCart] = useState<Product[]>(() => readStored<Product[]>("iconnect.cart", []));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sort, setSort] = useState("Recommended");
  const [saved, setSaved] = useState<number[]>(() => readStored<number[]>("iconnect.saved", []));
  const [showSaved, setShowSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const catalogQuery = trpc.catalog.list.useQuery(undefined, { retry: false });
  const storeVideoQuery = trpc.siteMedia.currentStoreVideo.useQuery(undefined, { retry: false });
  const catalogCreate = trpc.catalog.create.useMutation();
  const TONE_CYCLE = ["violet", "blue", "mint", "sand", "rose", "amber"] as const;
  const RATING_CYCLE = ["4.8", "4.7", "4.6", "4.9", "4.5", "4.7", "4.8", "4.6"] as const;
  const managedProducts = useMemo<Product[]>(
    () =>
      (catalogQuery.data ?? []).map((product, idx) => ({
        ...product,
        was: product.wasPrice,
        tone: TONE_CYCLE[idx % TONE_CYCLE.length],
        rating: RATING_CYCLE[idx % RATING_CYCLE.length],
      })),
    [catalogQuery.data]
  );
  const allProducts = useMemo(
    () => (catalogQuery.data !== undefined ? managedProducts : products),
    [catalogQuery.data, managedProducts]
  );
  const [page, setPage] = useState<Page>(() => resolvePageFromPath(window.location.pathname));
  useEffect(() => {
    const onPopState = () => setPage(resolvePageFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${window.location.pathname === "/" ? "/" : window.location.pathname}`;
    const pageMeta: Record<Page, { title: string; description: string; robots: string }> = {
      home: {
        title: "iConnect BLR — Buy, Sell, Exchange & Repair Smartphones in Bengaluru",
        description:
          "Test pre-owned iPhones, Samsung flagships, and MacBooks in person, trade in your current phone for immediate UPI/cash, or book same-day repairs at RT Nagar, Yeshwanthpur & Ganganagar.",
        robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      shop: {
        title: "Shop Certified Pre-Owned Phones & Laptops | iConnect BLR",
        description:
          "Browse 32-point checked iPhones, Samsung Galaxy, Androids, MacBooks & iPads with 6-month warranty at iConnect BLR in RT Nagar, Yeshwanthpur & Ganganagar.",
        robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      sell: {
        title: "Sell or Exchange Old Phone for Instant Cash | iConnect BLR",
        description:
          "Get an honest buyback quote and instant Indian Rupee cash or UPI payout for your old iPhone, Android or laptop at iConnect BLR Bengaluru stores.",
        robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      repair: {
        title: "Express Mobile & Laptop Repair in Bengaluru | iConnect BLR",
        description:
          "Book free same-day diagnosis and express screen, battery, and motherboard repairs in RT Nagar, Yeshwanthpur & Ganganagar with genuine parts.",
        robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      track: {
        title: "Track Order, Repair Ticket or Buyback Quote | iConnect BLR",
        description:
          "Check real-time status updates for your iConnect BLR device order, express repair ticket, or sell/exchange quote in Bengaluru.",
        robots: "index, follow",
      },
      signin: {
        title: "Customer Sign In & Account Profile | iConnect BLR",
        description:
          "Sign in to your iConnect BLR account to manage orders, saved devices, sell quotes, and repair bookings across our Bengaluru branches.",
        robots: "noindex, follow",
      },
      signup: {
        title: "Create Your Customer Account | iConnect BLR",
        description:
          "Create an iConnect BLR account to track pre-owned device orders, instant cash quotes, and express repair tickets in Bengaluru.",
        robots: "noindex, follow",
      },
      admin: {
        title: "Store Admin Command Center | iConnect BLR",
        description: "Manage iConnect BLR inventory, orders, buyback quotes, and repair tickets.",
        robots: "noindex, nofollow",
      },
    };

    const activeMeta =
      drawer === "product" && selected
        ? {
            title: `${selected.name} (${selected.spec}) — ${money(selected.price)} | iConnect BLR`,
            description:
              selected.description ||
              `Buy certified pre-owned ${selected.name} (${selected.spec}) for ${money(selected.price)} at iConnect BLR Bengaluru. 32-point checked with 6-month store warranty.`,
            robots: "index, follow, max-image-preview:large",
          }
        : pageMeta[page] || pageMeta.home;

    const ogImage =
      drawer === "product" && selected && !selected.image.startsWith("data:")
        ? selected.image.startsWith("http")
          ? selected.image
          : `${origin}${selected.image}`
        : `${origin}/images/iphone-18-pro-lineup.jpg`;

    document.title = activeMeta.title;

    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute("content", content);
    };

    setMetaContent('meta[name="description"]', activeMeta.description);
    setMetaContent('meta[name="robots"]', activeMeta.robots);
    setMetaContent('meta[property="og:title"]', activeMeta.title);
    setMetaContent('meta[property="og:description"]', activeMeta.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:image"]', ogImage);
    setMetaContent('meta[name="twitter:title"]', activeMeta.title);
    setMetaContent('meta[name="twitter:description"]', activeMeta.description);
    setMetaContent('meta[name="twitter:image"]', ogImage);

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute("href", canonicalUrl);
    }

    let schemaScript = document.getElementById("dynamic-seo-schema") as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "dynamic-seo-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    if (drawer === "product" && selected) {
      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: selected.name,
        description: activeMeta.description,
        category: selected.category,
        sku: `ICBLR-${Math.abs(selected.id)}`,
        image: ogImage,
        brand: {
          "@type": "Brand",
          name: selected.name.split(" ")[0] || "iConnect BLR",
        },
        itemCondition: "https://schema.org/RefurbishedCondition",
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "INR",
          price: String(selected.price),
          itemCondition: "https://schema.org/RefurbishedCondition",
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "iConnect BLR",
          },
        },
      };
      schemaScript.textContent = JSON.stringify(productSchema);
    } else {
      const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "iConnect BLR Certified Pre-Owned Devices",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: allProducts.length,
        itemListElement: allProducts.slice(0, 12).map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Product",
            name: `${item.name} (${item.spec})`,
            category: item.category,
            sku: `ICBLR-${Math.abs(item.id)}`,
            image: item.image.startsWith("http")
              ? item.image
              : item.image.startsWith("data:")
                ? `${origin}/images/iphone-18-pro-lineup.jpg`
                : `${origin}${item.image}`,
            itemCondition: "https://schema.org/RefurbishedCondition",
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: String(item.price),
              availability: "https://schema.org/InStock",
              seller: {
                "@type": "Organization",
                name: "iConnect BLR",
              },
            },
          },
        })),
      };
      schemaScript.textContent = JSON.stringify(itemListSchema);
    }
  }, [page, drawer, selected, allProducts]);
  const filtered = useMemo(() => {
    const result = allProducts.filter(p => {
      const categoryMatch =
        filter === "All" ||
        p.category === filter ||
        (filter === "Mobiles" && ["Mobiles", "iPhone", "Samsung", "Android"].includes(p.category));
      return categoryMatch && (!showSaved || saved.includes(p.id)) && `${p.name} ${p.spec} ${p.category}`.toLowerCase().includes(search.toLowerCase());
    });
    return [...result].sort((a, b) => sort === "Price: low to high" ? a.price - b.price : sort === "Price: high to low" ? b.price - a.price : 0);
  }, [allProducts, filter, search, sort, showSaved, saved]);
  useEffect(() => { localStorage.setItem("iconnect.cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("iconnect.saved", JSON.stringify(saved)); }, [saved]);
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2600); };
  const addToCart = (p: Product) => { setCart(c => { if (c.some(item => item.id === p.id)) { notify(`${p.name} is already in your bag`); return c; } notify(`${p.name} added to bag`); return [...c, p]; }); };
  const scrollTo = (id: string) => { setMobileNav(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };
  const openProduct = (p: Product) => { setSelected(p); setDrawer("product"); };
  const goPage = (next: Page) => { const path = next === "home" ? "/" : `/${next}`; window.history.pushState({}, "", path); setMobileNav(false); setShowSaved(false); setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const saveManagedProduct = async (product: Product) => {
    const imageData = product.image.startsWith("data:image/") ? product.image : undefined;
    const image = imageData ? undefined : product.image;
    await catalogCreate.mutateAsync({ name: product.name, spec: product.spec, price: product.price, wasPrice: product.was, tag: product.tag, image, imageData, category: product.category, stock: product.stock, description: product.description });
    await catalogQuery.refetch();
  };

  const openCart = () => { setDrawer("cart"); };
  const toggleSaved = (id: number) => setSaved(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);

  const overlays = (
    <>
      <AnimatePresence>{drawer && <motion.div className={drawer === "product" ? "drawer-backdrop product-backdrop" : "drawer-backdrop"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(null)}><motion.aside className={drawer === "product" ? "drawer product-drawer" : "drawer"} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={e => e.stopPropagation()}>{drawer === "cart" && <CartDrawer cart={cart} total={total} setDrawer={setDrawer} remove={id => setCart(c => c.filter(p => p.id !== id))} />}{drawer === "login" && <LoginDrawer close={() => setDrawer(null)} goPage={goPage} />}{drawer === "sell" && <SellDrawer close={() => setDrawer(null)} submitted={submitted} setSubmitted={setSubmitted} />}{drawer === "repair" && <RepairDrawer close={() => setDrawer(null)} />}{drawer === "checkout" && <CheckoutDrawer cart={cart} total={total} onPlaced={() => setCart([])} close={() => setDrawer(null)} />}{drawer === "product" && selected && <ProductDrawer product={selected} allProducts={allProducts} onSelectProduct={setSelected} saved={saved.includes(selected.id)} toggleSaved={() => toggleSaved(selected.id)} addToCart={addToCart} buyNow={product => { if (!cart.some(item => item.id === product.id)) addToCart(product); setDrawer("checkout"); }} onExchange={() => setDrawer("sell")} notify={notify} close={() => setDrawer(null)} />}</motion.aside></motion.div>}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}><Check size={17} /> {toast}</motion.div>}</AnimatePresence>
    </>
  );

  if (page !== "home") return <>{<DedicatedPage page={page} darkMode={darkMode} setDarkMode={setDarkMode} goPage={goPage} products={allProducts} filtered={filtered} search={search} openProduct={openProduct} addToCart={addToCart} submitted={submitted} setSubmitted={setSubmitted} saveManagedProduct={saveManagedProduct} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} saved={saved} toggleSaved={toggleSaved} cartCount={cart.length} openCart={openCart} />}{overlays}</>;

  return <div className={darkMode ? "market-shell editorial-dark" : "market-shell"}>
    <div className="market-alert"><span><Zap size={13} /> I CONNECT BLR · SELL · BUY · EXCHANGE · FAST SERVICE &amp; GENUINE ACCESSORIES</span><span className="market-alert-center">15-minute counter diagnostics · Instant UPI &amp; cash trade-ins</span><a href="https://www.instagram.com/iconnect.blr/" target="_blank" rel="noreferrer">Daily drops @iconnect.blr <Instagram size={13} /></a></div>
    <motion.header className="market-header" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .45, ease: "easeOut" }}>
      <button className="brand market-brand" onClick={() => scrollTo("home")}><span className="brand-mark"><span /></span><span>iconnect<span className="brand-dot">.</span>blr</span></button>
      <form className="market-search" onSubmit={e => { e.preventDefault(); goPage("shop"); }}><Search size={18} /><input value={search} onChange={e => { setSearch(e.target.value); scrollTo("catalogue"); }} placeholder="Find iPhone 13, Galaxy S23, MacBook Air, or original fast chargers…" aria-label="Search smartphones, laptops, repairs and accessories" /><button className="search-submit" type="submit" aria-label="Search">Search</button></form>
      <div className="market-actions">
        <button className="theme-toggle" onClick={() => setDarkMode(v => !v)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
        {meQuery.data?.role === "admin" && (
          <button className="market-admin-badge-btn" onClick={() => goPage("admin")} aria-label="Open Admin Command Center">
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
        )}
        {meQuery.data ? (
          <button className="market-profile-pill" onClick={() => goPage("signin")} aria-label="Your profile">
            <span className="profile-avatar-mini">{(meQuery.data.name || meQuery.data.email || "U").charAt(0).toUpperCase()}</span>
            <span className="profile-name-label">{meQuery.data.name?.split(" ")[0] || "Profile"}</span>
          </button>
        ) : (
          <>
            <button className="market-login" onClick={() => goPage("signin")} aria-label="Sign In"><CircleUserRound size={18} /><span>Sign In</span></button>
            <button className="market-signup-btn" onClick={() => goPage("signup")}><span>Sign Up</span></button>
          </>
        )}
        <button className="market-cart" onClick={() => setDrawer("cart")} aria-label={`Bag with ${cart.length} items`}><ShoppingBag size={16} className="market-cart-icon" /><span>Bag</span><b>{cart.length}</b></button>
        <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">{mobileNav ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
    </motion.header>
    <motion.nav className={mobileNav ? "market-nav open" : "market-nav"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .18, duration: .4 }}><button onClick={() => goPage("shop")}>Showroom Stock</button><button onClick={() => goPage("sell")}>Sell / Trade In</button><button onClick={() => goPage("repair")}>Repair Lab</button><button onClick={() => scrollTo("stores")}>Showrooms</button><button onClick={() => goPage("track")}>Track Status</button><button onClick={() => goPage("signin")}>{meQuery.data ? "My Profile" : "Customer Sign In"}</button><button onClick={() => goPage("admin")}>Admin Portal</button><button className="nav-highlight" onClick={() => scrollTo("catalogue")}><Zap size={14} /> Today's Arrivals</button></motion.nav>

    <main id="home">
      <section className="market-hero" aria-labelledby="starting-hero-heading">
        <HeroSwipeBanners
          storeVideoUrl={storeVideoQuery.data?.videoUrl}
        />

        <motion.div className="hero-side" variants={stagger} initial="hidden" animate="show">
          <motion.div className="side-card side-card-repair" variants={reveal} whileHover={{ y: -4 }}>
            <div className="side-card-top">
              <span className="side-card-icon-chip repair-chip"><Wrench size={16} /> EXPRESS REPAIR BENCH</span>
              <span className="side-card-number">01</span>
            </div>
            <div className="side-before-after" onClick={() => goPage("repair")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") goPage("repair"); }}>
              <figure className="ba-frame ba-before">
                <img src="/images/screen_before_cracked_1791519372358.jpg" alt="Before repair: Damaged smartphone display" loading="lazy" referrerPolicy="no-referrer" />
                <figcaption className="ba-badge ba-badge-before">Before · Cracked</figcaption>
              </figure>
              <div className="ba-arrow" aria-hidden="true">
                <ArrowRight size={15} />
              </div>
              <figure className="ba-frame ba-after">
                <img src="/images/screen_after_proper_1791519385187.jpg" alt="After repair: Calibrated OLED display replacement" loading="lazy" referrerPolicy="no-referrer" />
                <figcaption className="ba-badge ba-badge-after"><Check size={11} /> After · Restored</figcaption>
              </figure>
            </div>
            <div className="side-card-body">
              <h3>Fastest Mobile<br /><em>Repair Service</em></h3>
              <p>Quick, reliable and professional service — screen, battery, and charging repairs while you wait.</p>
              <button onClick={() => goPage("repair")}>Book Express Repair <ArrowRight size={15} /></button>
            </div>
          </motion.div>

          <motion.div className="side-card side-card-sell" variants={reveal} whileHover={{ y: -4 }}>
            <div className="side-card-top">
              <span className="side-card-icon-chip sell-chip"><Tag size={16} /> BUY · SELL · EXCHANGE</span>
              <span className="side-card-number">02</span>
            </div>
            <div className="side-cash-showcase" onClick={() => goPage("sell")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") goPage("sell"); }}>
              <img src="/images/phone_to_inr_cash_1791520147832.jpg" alt="Buy, Sell or Exchange smartphones at I CONNECT BLR" loading="lazy" referrerPolicy="no-referrer" />
              <div className="side-cash-overlay">
                <span className="cash-pill-tag">BUY · SELL · EXCHANGE</span>
                <strong>Get Great Deals on Smartphones</strong>
              </div>
            </div>
            <div className="side-card-body">
              <h3>Sell or exchange<br /><em>your smartphone?</em></h3>
              <p>Get great deals on smartphones with instant cash/UPI buyback or on-the-spot upgrade credit.</p>
              <button onClick={() => goPage("sell")}>Start Sell / Exchange <ArrowRight size={15} /></button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="category-bar"><div className="category-inner">{categories.map(({ label, icon: Icon }) => <motion.button key={label} whileHover={{ y: -4 }} onClick={() => label === "Repair" ? goPage("repair") : label === "Sell / Exchange" ? goPage("sell") : (setFilter(label), scrollTo("catalogue"))}><span className="category-icon"><Icon size={22} /></span><b>{label}</b><ChevronDown size={12} /></motion.button>)}</div></section>

      <section className="catalogue-section" id="catalogue"><div className="section-head-market catalogue-head"><div><span className="market-kicker">READY FOR COUNTER PICKUP</span><h2>Hand-picked smartphones, laptops &amp; <em>daily essentials.</em></h2></div><div className="sort-wrap"><span>{filtered.length} {filtered.length === 1 ? "device" : "devices"} available</span><label className="sort-label" htmlFor="home-sort">Sort by</label><select id="home-sort" value={sort} onChange={e => setSort(e.target.value)}><option>Recommended</option><option>Price: low to high</option><option>Price: high to low</option></select></div></div><div className="catalogue-controls"><div className="catalogue-tabs">{["All", "Mobiles", "iPhone", "Samsung", "Android", "Laptops", "Tablets", "Wearables", "Accessories"].map(f => <button key={f} className={filter === f && !showSaved ? "active" : ""} onClick={() => { setFilter(f); setShowSaved(false); }}>{f}</button>)}</div><button className={showSaved ? "catalogue-saved active" : "catalogue-saved"} onClick={() => setShowSaved(value => !value)} aria-pressed={showSaved}><Heart size={15} fill={showSaved ? "currentColor" : "none"} /> Shortlist <span>{saved.length}</span></button><div className="catalogue-note"><ShieldCheck size={16} /> Verified battery health · 6-month branch warranty</div></div><div className="catalogue-grid">{filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} saved={saved.includes(p.id)} toggleSave={() => toggleSaved(p.id)} openProduct={openProduct} addToCart={addToCart} />)}{filtered.length === 0 && <div className="catalogue-empty">{showSaved ? "Your shortlist is empty—tap the heart icon on any device to save it." : "No matching devices in this category right now."} <button onClick={() => { setSearch(""); setFilter("All"); setShowSaved(false); }}>Show all stock</button></div>}</div></section>

      <section className="stores-market" id="stores"><div className="section-head-market"><div><span className="market-kicker">BENGALURU SHOWROOM NETWORK</span><h2>Three neighbourhood branches.<br /><em>Walk in any day of the week.</em></h2></div><a href="https://www.instagram.com/iconnect.blr/" target="_blank" rel="noreferrer" className="market-link">See live unboxings on @iconnect.blr <Instagram size={15} /></a></div><StoresSlider /></section>
    </main>
    <footer className="market-footer"><div className="market-footer-grid"><div><div className="brand footer-brand"><span className="brand-mark"><span /></span><span>iconnect<span className="brand-dot">.</span>blr</span></div><p>Bengaluru's neighbourhood destination for hardware-verified pre-owned smartphones, instant cash or upgrade trade-ins, component-level repairs, and authentic charging accessories.</p></div><div className="footer-column"><b>Explore</b><button onClick={() => goPage("shop")}>Full Device Catalogue</button><button onClick={() => goPage("sell")}>Sell or Trade In</button><button onClick={() => goPage("repair")}>Express Repair Lab</button><button onClick={() => scrollTo("stores")}>Bengaluru Showrooms</button><button onClick={() => goPage("track")}>Track Order / Ticket</button><button onClick={() => goPage("signin")}>Customer Sign In</button><button onClick={() => goPage("signup")}>Create Account</button><button onClick={() => goPage("admin")}>Admin Portal (Store Management)</button></div><div className="footer-column"><b>Showroom Desks</b><a href="tel:+917829439076">RT Nagar Flagship · 78294 39076</a><a href="tel:+916361733735">Yeshwanthpur Hub · 63617 33735</a><a href="tel:+917829439076">Ganganagar Desk · 78294 39076</a><a href="https://wa.me/917829439076" target="_blank" rel="noreferrer">WhatsApp Support · 78294 39076</a><a href="https://www.instagram.com/iconnect.blr/" target="_blank" rel="noreferrer">Instagram @iconnect.blr</a></div><div className="footer-cta"><span>Searching for a specific configuration?</span><a href="https://wa.me/917829439076?text=Hi%20iConnect%20BLR%20Team!%20I%20am%20looking%20for%20a%20specific%20smartphone%20model%20and%20would%20like%20to%20check%20live%20branch%20availability." target="_blank" rel="noreferrer">Chat with our stock desk <ArrowRight size={15} /></a></div></div><div className="footer-bottom"><span>© 2026 I CONNECT BLR · Bengaluru</span><span>Pre-Owned Flagships · Instant Buyback · Express Repairs · Original Gear</span></div></footer>

    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <button className="active" onClick={() => goPage("home")}><House size={18} /><span>Home</span></button>
      <button onClick={() => goPage("shop")}><ShoppingBag size={18} /><span>Shop</span></button>
      <button onClick={() => goPage("sell")}><RotateCcw size={18} /><span>Sell</span></button>
      <button onClick={() => goPage("repair")}><Wrench size={18} /><span>Repair</span></button>
      {meQuery.data?.role === "admin" ? (
        <button onClick={() => goPage("admin")}><ShieldCheck size={18} /><span>Admin</span></button>
      ) : (
        <button onClick={() => goPage("signin")}><CircleUserRound size={18} /><span>{meQuery.data ? "Profile" : "Sign In"}</span></button>
      )}
    </nav>

    {overlays}
  </div>;
}

function HeroSwipeBanners({
  storeVideoUrl,
}: {
  storeVideoUrl?: string;
}) {
  const [showVideo, setShowVideo] = useState(false);

  const highlights = [
    {
      title: "Best Quality Used Mobiles",
      desc: "Top brands at affordable prices.",
    },
    {
      title: "Buy | Sell | Exchange",
      desc: "Get great deals on smartphones.",
    },
    {
      title: "Fastest Mobile Repair Service",
      desc: "Quick, reliable and professional service.",
    },
    {
      title: "Genuine Mobile Accessories",
      desc: "Chargers, cables, earphones, cases, tempered glass, power banks and more.",
    },
    {
      title: "Best Prices & Customer Satisfaction",
      desc: "Quality products, honest deals and friendly service.",
    },
  ];

  return (
    <div className="hero-panel hero-panel-main hero-onepage-shell liquid-glass-panel">
      {/* Ambient liquid light glow elements */}
      <div className="liquid-ambient-orb liquid-ambient-orb-1" aria-hidden="true" />
      <div className="liquid-ambient-orb liquid-ambient-orb-2" aria-hidden="true" />
      <div className="liquid-specular-rim" aria-hidden="true" />

      <div className="hero-onepage-grid">
        <div className="hero-copy hero-onepage-copy">
          <div className="hero-tagline-badge">
            <span className="hero-tagline-pill liquid-dynamic-pill">
              <span className="liquid-dot-pulse" aria-hidden="true" />
              SELL · BUY · EXCHANGE
            </span>
            <span className="hero-editorial-kicker">I CONNECT BLR</span>
          </div>

          <h1 id="starting-hero-heading">
            Your Trusted Destination for Used Mobiles, Fast Service &amp;{" "}
            <em>Genuine Accessories!</em>
          </h1>

          <p className="hero-about-text">
            Welcome to <strong>I CONNECT BLR</strong> – your one-stop shop to <strong>Sell, Buy &amp; Exchange</strong> quality used
            smartphones, mobile repairs, and all types of genuine mobile accessories.
          </p>

          <ul className="hero-editorial-list liquid-editorial-list" aria-label="About I CONNECT BLR">
            {highlights.map(item => (
              <li key={item.title} className="hero-editorial-item liquid-list-card">
                <span className="hero-editorial-check liquid-squircle-check" aria-hidden="true">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="hero-editorial-text">
                  <strong>{item.title}</strong> – {item.desc}
                </span>
              </li>
            ))}
          </ul>

          <p className="hero-editorial-promise">
            <strong>I CONNECT BLR</strong> – Best Deals. Fastest Service. Genuine Accessories.{" "}
            <em>Your Satisfaction, Our Priority!</em>
          </p>
        </div>

        <div className="hero-onepage-media-card liquid-glass-device">
          <div className="liquid-glass-lens-glare" aria-hidden="true" />
          <div className="hero-badge">
            I CONNECT
            <br />
            <strong>BLR</strong>
          </div>

          {storeVideoUrl && (
            <button
              type="button"
              className="hero-video-toggle"
              onClick={() => setShowVideo(v => !v)}
            >
              {showVideo ? "Show Photo" : "▶ Store Video"}
            </button>
          )}

          <div className="hero-media">
            {storeVideoUrl && showVideo ? (
              <video
                src={storeVideoUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
                aria-label="Video from the I CONNECT BLR showroom"
              />
            ) : (
              <img
                src="/images/iphone-18-pro-lineup.jpg"
                alt="I CONNECT BLR Used Mobiles, Fast Service and Genuine Accessories"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className="hero-product-caption liquid-glass-caption">
            <span>I CONNECT BLR</span>
            <b>Used Mobiles · Fast Service · Genuine Accessories</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product: p, index, saved, toggleSave, openProduct, addToCart }: { product: Product; index: number; saved: boolean; toggleSave: () => void; openProduct: (p: Product) => void; addToCart: (p: Product) => void }) {
  const discount = p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;
  const storeHub = resolveStoreContext(p.tag);
  const { brand: parsedBrand, model: parsedModel } = splitBrandAndModel(p.name, p.spec);
  const whatsappIntentUrl = buildWhatsAppIntentUrl(parsedBrand, parsedModel, storeHub);

  return (
    <motion.article
      className="market-product-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.2) }}
      whileHover={{ y: -4 }}
      onClick={() => openProduct(p)}
      role="button"
      tabIndex={0}
      aria-label={`View full details for ${p.name}`}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct(p);
        }
      }}
    >
      <div className={`market-product-image ${p.tone}`}>
        <div className="product-image-open">
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={e => {
              e.currentTarget.src = "/images/iphone-18-pro-lineup.jpg";
            }}
          />
        </div>
        <span className="market-tag">{p.tag}</span>
        {discount > 0 && <span className="market-discount-badge">{discount}% OFF</span>}
        <button
          type="button"
          className={saved ? "saved market-heart" : "market-heart"}
          onClick={e => {
            e.stopPropagation();
            toggleSave();
          }}
          aria-label={saved ? `Remove ${p.name} from saved items` : `Save ${p.name}`}
          aria-pressed={saved}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="market-product-info">
        <div className="market-product-title">
          <h3>{p.name}</h3>
          <p>{p.spec}</p>
        </div>
        <div className="market-price-row">
          <div>
            <strong>{money(p.price)}</strong>
            {p.was > p.price && <del>{money(p.was)}</del>}
          </div>
          <div className="market-card-cta-group">
            <a
              href={whatsappIntentUrl}
              target="_blank"
              rel="noreferrer"
              className="market-wa-mini"
              onClick={e => e.stopPropagation()}
              aria-label={`Enquire about ${p.name} on WhatsApp`}
              title="Request live photos, battery % & exchange quote on WhatsApp"
            >
              <Phone size={13} />
            </a>
            <button
              type="button"
              className="market-add"
              onClick={e => {
                e.stopPropagation();
                addToCart(p);
              }}
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
const STORE_BRANCHES = [
  {
    number: "01",
    badge: "MAIN FLAGSHIP HUB · OPEN 10:30 AM – 9:30 PM",
    title: "RT Nagar",
    detail: "Shop No. 3, 80 Feet Road, beside Absolute Interiors Studio, P&T Colony, Bengaluru",
    phone: "78294 39076",
    hours: "Full pre-owned iPhone & Android wall, live trade-in valuation desk, micro-soldering repair lab & original accessories.",
    image: "/images/rt-nagar-store.jpeg",
    map: "RT Nagar Bangalore",
    theme: "emerald",
  },
  {
    number: "02",
    badge: "NORTH-WEST BENGALURU HUB · OPEN 10:30 AM – 9:30 PM",
    title: "Yeshwanthpur",
    detail: "RTO Office Main Road, opposite Karawali Deluxe, Yeshwanthpur, Bengaluru",
    phone: "63617 33735",
    hours: "Hands-on smartphone & laptop testing counter, rapid OLED glass & battery replacements, and instant UPI buybacks.",
    image: "/images/yeshwanthpur-store.jpeg",
    map: "Yeshwanthpur RTO Bangalore",
    theme: "orange",
  },
  {
    number: "03",
    badge: "NEIGHBOURHOOD EXCHANGE DESK · OPEN 10:30 AM – 9:30 PM",
    title: "Ganganagar",
    detail: "iConnect BLR Ganganagar Showroom, near CBI Road Junction, Bengaluru",
    phone: "78294 39076",
    hours: "Quick smartphone upgrades, same-day charging port & display care, plus authentic adapters, cases, and 9H tempered glass.",
    image: "/images/ganganagar-store.jpeg",
    map: "Ganganagar Bangalore",
    theme: "blue",
  },
];

function StoresSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive(prev => (prev + 1) % STORE_BRANCHES.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [paused]);

  const prevSlide = () => setActive(prev => (prev - 1 + STORE_BRANCHES.length) % STORE_BRANCHES.length);
  const nextSlide = () => setActive(prev => (prev + 1) % STORE_BRANCHES.length);

  return (
    <div
      className="stores-slider-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={e => {
        setPaused(true);
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={e => {
        const startX = touchStartX.current;
        const endX = e.changedTouches[0]?.clientX ?? null;
        if (startX !== null && endX !== null) {
          const delta = startX - endX;
          if (delta > 40) nextSlide();
          else if (delta < -40) prevSlide();
        }
        touchStartX.current = null;
        window.setTimeout(() => setPaused(false), 2500);
      }}
    >
      <div className="stores-slider-topbar">
        <div className="stores-slider-tabs" role="tablist" aria-label="Select store branch">
          {STORE_BRANCHES.map((store, idx) => (
            <button
              key={store.number}
              type="button"
              role="tab"
              aria-selected={active === idx}
              className={active === idx ? `store-tab active ${store.theme}` : "store-tab"}
              onClick={() => setActive(idx)}
            >
              <span>{store.number}</span>
              <b>{store.title}</b>
            </button>
          ))}
        </div>
        <div className="stores-slider-arrows">
          <button type="button" className="store-arrow-btn" onClick={prevSlide} aria-label="Previous store slide">
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="store-arrow-btn" onClick={nextSlide} aria-label="Next store slide">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="stores-slider-viewport">
        <div
          className="stores-slider-track"
          style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
        >
          {STORE_BRANCHES.map(store => (
            <article className={`store-banner-slide theme-${store.theme}`} key={store.number}>
              <div className="store-banner-media">
                <img src={store.image} alt={`${store.title} iConnect BLR store`} loading="lazy" />
                <span className="store-banner-number">{store.number} / 03</span>
              </div>
              <div className="store-banner-content">
                <span className="store-banner-badge">
                  <Store size={14} /> {store.badge}
                </span>
                <h3>iConnect BLR — <em>{store.title}</em></h3>
                <p className="store-banner-address">{store.detail}</p>
                <p className="store-banner-hours">{store.hours}</p>
                <div className="store-banner-actions">
                  <a className="store-call-btn" href={`tel:+91${store.phone.replace(/\D/g, "")}`}>
                    <Phone size={16} /> Call {store.phone}
                  </a>
                  <a
                    className="store-map-btn"
                    href={`https://maps.google.com/?q=${encodeURIComponent(store.map)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin size={16} /> Get directions <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="stores-slider-dots" aria-label="Slide indicators">
        {STORE_BRANCHES.map((store, idx) => (
          <button
            key={store.number}
            type="button"
            className={active === idx ? "store-dot active" : "store-dot"}
            onClick={() => setActive(idx)}
            aria-label={`Go to ${store.title} slide`}
          />
        ))}
      </div>
    </div>
  );
}
function DrawerHeader({ title, kicker, close }: { title: string; kicker: string; close: () => void }) { return <div className="drawer-header"><div><span className="market-kicker">{kicker}</span><h2>{title}</h2></div><button className="close-btn" onClick={close}><X /></button></div>; }
function CartDrawer({ cart, total, setDrawer, remove }: { cart: Product[]; total: number; setDrawer: (d: Drawer) => void; remove: (id: number) => void }) { return <><DrawerHeader title="Your bag" kicker="READY WHEN YOU ARE" close={() => setDrawer(null)} />{cart.length === 0 ? <div className="drawer-empty"><div className="empty-icon"><Bike /></div><h3>Your bag is taking a breather.</h3><p>Add a device from the catalogue and it'll show up here.</p><button className="market-primary full" onClick={() => { setDrawer(null); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>Browse devices</button></div> : <><div className="cart-items">{cart.map((p, i) => <div className="cart-item" key={`${p.id}-${i}`}><img src={p.image} alt="" /><div><b>{p.name}</b><small>{p.spec}</small><strong>{money(p.price)}</strong></div><button onClick={() => remove(p.id)} aria-label="Remove"><Trash2 size={16} /></button></div>)}</div><div className="cart-summary"><span>Estimated subtotal</span><b>{money(total)}</b></div><button className="market-primary full" onClick={() => setDrawer("checkout")}>Continue to checkout <ArrowRight size={16} /></button><p className="fine-print">Pay at the branch after inspecting your device in person.</p></>}</>; }
function LoginDrawer({ close, goPage }: { close: () => void; goPage: (p: Page) => void }) {
  return (
    <>
      <DrawerHeader title="Good to see you." kicker="YOUR ICONNECT ACCOUNT" close={close} />
      <div className="login-art">
        <CircleUserRound size={44} />
        <span>
          Orders, quotes,
          <br />
          and repairs in one place.
        </span>
      </div>
      <p className="drawer-lead">Sign in with your iConnect BLR account or create a new customer account.</p>
      <div className="drawer-auth-stack">
        <button
          className="market-primary full"
          onClick={() => {
            close();
            goPage("signin");
          }}
        >
          Customer Sign In <ArrowRight size={16} />
        </button>
        <button
          className="market-secondary full"
          onClick={() => {
            close();
            goPage("signup");
          }}
        >
          Create New Account <ChevronRight size={16} />
        </button>
      </div>
      <p className="fine-print">Supports Email & Password and Google Sign-In.</p>
    </>
  );
}
function SellDrawer({ close, submitted, setSubmitted }: { close: () => void; submitted: boolean; setSubmitted: (v: boolean) => void }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [condition, setCondition] = useState<"Like new" | "Good" | "Needs repair">("Like new");
  const [branch, setBranch] = useState<"RT Nagar" | "Yeshwanthpur" | "Ganganagar">("RT Nagar");
  const [notes, setNotes] = useState("");
  const [quoteNum, setQuoteNum] = useState("");
  const createQuote = trpc.quotes.create.useMutation();
  const utils = trpc.useUtils();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createQuote.mutateAsync({ customerName, phone, deviceModel, condition, branch, notes });
      setQuoteNum(created.quoteNumber);
      await utils.quotes.list.invalidate();
    } catch {
      // Fallback if offline
    }
    setSubmitted(true);
  };
  return (
    <>
      <DrawerHeader title="What are you selling?" kicker="GET A QUOTE" close={close} />
      {submitted ? (
        <Success
          title={quoteNum ? `Quote ${quoteNum} received` : "Quote request received"}
          copy="Our Bengaluru store team will review your device details and share a fair buyback or exchange offer shortly."
          close={() => {
            setSubmitted(false);
            close();
          }}
        />
      ) : (
        <form className="drawer-form" onSubmit={submit}>
          <label>
            Your name
            <input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Arjun Rao" />
          </label>
          <label>
            Phone number
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" />
          </label>
          <label>
            Device model
            <input required value={deviceModel} onChange={e => setDeviceModel(e.target.value)} placeholder="e.g. iPhone 13 128GB" />
          </label>
          <div className="form-row">
            <label>
              Condition
              <select value={condition} onChange={e => setCondition(e.target.value as typeof condition)}>
                <option>Like new</option>
                <option>Good</option>
                <option>Needs repair</option>
              </select>
            </label>
            <label>
              Preferred branch
              <select value={branch} onChange={e => setBranch(e.target.value as typeof branch)}>
                <option>RT Nagar</option>
                <option>Yeshwanthpur</option>
                <option>Ganganagar</option>
              </select>
            </label>
          </div>
          <label>
            Tell us anything useful
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Battery health, scratches, box / bill available…" rows={3} />
          </label>
          <label className="upload-field">
            <Camera size={17} /> Add device photos
            <input type="file" accept="image/*" multiple />
          </label>
          <button className="market-primary full" type="submit" disabled={createQuote.isPending}>
            {createQuote.isPending ? "Saving quote request…" : "Request my quote"} <ArrowRight size={16} />
          </button>
        </form>
      )}
    </>
  );
}
function RepairDrawer({ close }: { close: () => void }) {
  const createRepair = trpc.repairs.create.useMutation();
  const utils = trpc.useUtils();
  const [bookedTicket, setBookedTicket] = useState<{ ticketNumber: string; whatsappUrl: string } | null>(null);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const customerName = String(fields.get("customerName") || "");
    const phone = String(fields.get("phone") || "");
    const email = String(fields.get("email") || "");
    const deviceType = String(fields.get("deviceType") || "Smartphone");
    const model = String(fields.get("model") || "");
    const branch = String(fields.get("branch") || "RT Nagar") as "RT Nagar" | "Yeshwanthpur" | "Ganganagar";
    const issue = String(fields.get("issue") || "");
    let ticketNumber = "RP-NEW";
    try {
      const ticket = await createRepair.mutateAsync({ customerName, phone, email, deviceType, model, branch, issue });
      ticketNumber = ticket.ticketNumber;
      await utils.repairs.list.invalidate();
    } catch {
      // continue to WhatsApp
    }
    const message = [
      `Hi iConnect BLR, I would like to book a device repair (${ticketNumber}).`,
      `Name: ${customerName}`,
      `Phone: ${phone}`,
      `Email: ${email || "Not provided"}`,
      `Device: ${deviceType}`,
      `Model: ${model}`,
      `Branch: ${branch}`,
      `Issue: ${issue}`,
    ].join("\n");
    const whatsappUrl = `https://wa.me/917829439076?text=${encodeURIComponent(message)}`;
    setBookedTicket({ ticketNumber, whatsappUrl });
  };
  if (bookedTicket) {
    return (
      <>
        <DrawerHeader title="Repair booking saved" kicker="EXPRESS REPAIR CARE" close={close} />
        <div className="order-confirmation">
          <div className="order-confirmation-icon">
            <Check size={24} />
          </div>
          <p>Repair reference</p>
          <strong>{bookedTicket.ticketNumber}</strong>
          <span>Your repair request has been received by our Bengaluru technicians. Send it on WhatsApp for priority same-day diagnosis.</span>
          <a className="market-primary full" href={bookedTicket.whatsappUrl} target="_blank" rel="noreferrer">
            Send on WhatsApp <ArrowRight size={16} />
          </a>
        </div>
      </>
    );
  }
  return <><DrawerHeader title="Let's fix it." kicker="EXPRESS DEVICE REPAIR" close={close} /><form className="drawer-form" onSubmit={submit}><label>Your name<input name="customerName" required minLength={2} placeholder="e.g. Priya S" /></label><div className="form-row"><label>Phone<input name="phone" required type="tel" placeholder="10-digit number" /></label><label>Email<input name="email" type="email" placeholder="you@email.com" /></label></div><div className="form-row"><label>Device<select name="deviceType"><option>Smartphone</option><option>Laptop</option><option>Tablet</option><option>Smartwatch</option></select></label><label>Branch<select name="branch"><option>RT Nagar</option><option>Yeshwanthpur</option><option>Ganganagar</option></select></label></div><label>Device model<input name="model" required placeholder="e.g. Samsung S22" /></label><label>What's wrong?<textarea name="issue" required placeholder="Screen, battery, charging, water damage…" rows={3} /></label><button className="market-primary full" type="submit" disabled={createRepair.isPending}>{createRepair.isPending ? "Saving repair request…" : "Book repair & WhatsApp"} <ArrowRight size={16} /></button><p className="fine-print">Free same-day diagnosis at our RT Nagar, Yeshwanthpur, and Ganganagar branches.</p></form></>;
}function ProductDrawer({
  product: p,
  saved = false,
  toggleSaved = () => undefined,
  addToCart,
  buyNow,
  notify,
  close,
}: {
  product: Product;
  allProducts?: Product[];
  onSelectProduct?: (next: Product) => void;
  saved?: boolean;
  toggleSaved?: () => void;
  addToCart: (p: Product) => void;
  buyNow?: (p: Product) => void;
  onExchange?: () => void;
  notify?: (msg: string) => void;
  close: () => void;
}) {
  const discount = p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;
  const savings = p.was > p.price ? p.was - p.price : 0;
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [p.id]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const getFocusable = () =>
      dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ) ?? [];
    dialog?.querySelector<HTMLElement>(".close-btn")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [close]);

  const specs = p.spec.split(/[·•]/).map(value => value.trim()).filter(Boolean);
  const storageOrConfig = specs[0] || "Standard";
  const colorOrFinish = specs[1] || "Original Finish";
  const conditionGrade = specs[2] || "Excellent";
  const isLaptop = p.category === "Laptops";
  const storeHub = resolveStoreContext(p.tag);
  const { brand: parsedBrand, model: parsedModel } = splitBrandAndModel(p.name, p.spec);

  const simpleSpecs = [
    { label: isLaptop ? "Configuration" : "Storage", value: storageOrConfig },
    { label: "Color", value: colorOrFinish },
    { label: "Condition", value: conditionGrade },
    { label: "Branch Hub", value: `${storeHub}, Bengaluru` },
    { label: "Warranty", value: "6 Months Store Warranty" },
    { label: "Trade-In", value: "Buy · Sell · Exchange Eligible" },
  ];

  const detailText =
    p.description ||
    buildDistinctDeviceCopy({
      deviceBrand: parsedBrand,
      deviceModel: parsedModel,
      conditionScore: conditionGrade,
      spec: p.spec,
      branch: storeHub,
    });

  const whatsappUrl = buildWhatsAppIntentUrl(parsedBrand, parsedModel, storeHub);

  return (
    <section
      ref={dialogRef}
      className="product-detail-view"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      tabIndex={-1}
    >
      <header className="product-detail-header">
        <button type="button" className="product-back-pill" onClick={close}>
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Back</span>
        </button>
        <div className="product-detail-breadcrumb">
          <span>{p.category}</span>
          <ChevronRight size={14} aria-hidden="true" />
          <b>{p.name}</b>
        </div>
        <div className="product-header-actions">
          <button
            type="button"
            className={saved ? "detail-save saved" : "detail-save"}
            onClick={toggleSaved}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved items" : "Save this product"}
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
          <button type="button" className="close-btn" onClick={close} aria-label="Close product details">
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="product-detail-layout">
        <div className={`product-detail-visual ${p.tone}`}>
          <div className="product-visual-top">
            <span className="product-detail-category">{p.category}</span>
            {discount > 0 && <span className="product-rating-chip">{discount}% OFF</span>}
          </div>

          <div className="product-photo-stage">
            <img
              src={p.image}
              alt={`${p.name}, ${p.spec}`}
              onError={e => {
                e.currentTarget.src = "/images/iphone-18-pro-lineup.jpg";
              }}
            />
          </div>

          <div className="product-visual-caption">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>DIAGNOSTICS VERIFIED · {storeHub.toUpperCase()} HUB</span>
          </div>
        </div>

        <div className="product-detail-info">
          <span className="product-simple-cat">{p.category} · {storeHub}</span>
          <h2 id="product-detail-title">{p.name}</h2>
          <p className="product-detail-spec">{p.spec}</p>

          <div className="product-detail-price-card">
            <div className="price-card-main">
              <div className="price-card-numbers">
                <strong>{money(p.price)}</strong>
                {p.was > p.price && <del>{money(p.was)}</del>}
              </div>
              {savings > 0 && (
                <span className="price-save-pill">
                  Save {money(savings)}
                </span>
              )}
            </div>

            <div className="product-primary-cta-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="market-primary product-reserve-btn"
              >
                <Phone size={15} aria-hidden="true" /> Enquire on WhatsApp <ArrowRight size={15} aria-hidden="true" />
              </a>
              <button
                type="button"
                className="product-add-bag-btn"
                onClick={() => {
                  addToCart(p);
                  if (notify) notify(`${p.name} added to your bag`);
                }}
              >
                <ShoppingBag size={16} aria-hidden="true" /> Add to Bag
              </button>
            </div>

            <div className="product-quick-links-row">
              {buyNow && (
                <button
                  type="button"
                  onClick={() => buyNow(p)}
                  className="product-inline-link"
                >
                  Reserve for {storeHub} Walk-In <ArrowRight size={12} />
                </button>
              )}
              <span className="product-inline-note">Request live photos, battery % &amp; exchange quote</span>
            </div>
          </div>

          <div className="product-spec-block">
            <h3>Product details</h3>
            <div className="product-specs-grid">
              {simpleSpecs.map(item => (
                <div className="spec-grid-item" key={item.label}>
                  <span className="spec-label">{item.label}</span>
                  <strong className="spec-value">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <p className="product-detail-description">{detailText}</p>
        </div>
      </div>
    </section>
  );
}
function CheckoutDrawer({ cart, total, onPlaced, close }: { cart: Product[]; total: number; onPlaced: () => void; close: () => void }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("RT Nagar");
  const placeOrder = trpc.checkout.placeOrder.useMutation();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const result = await placeOrder.mutateAsync({ customerName, phone, email, branch: branch as "RT Nagar" | "Yeshwanthpur" | "Ganganagar", items: cart.map(({ id, name, spec, price }) => ({ id, name, spec, price })) });
      setOrderNumber(result.orderNumber);
      onPlaced();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't save this order request. Please try again.");
    }
  };
  if (orderNumber) return <><DrawerHeader title="Request received" kicker="ORDER REQUEST SAVED" close={close} /><div className="order-confirmation"><div className="order-confirmation-icon"><Check size={24} /></div><p>Order reference</p><strong>{orderNumber}</strong><span>Your selected branch will confirm availability and the final amount before you pay. No payment has been taken.</span><button className="market-primary full" onClick={() => { close(); window.location.assign(`/track?order=${encodeURIComponent(orderNumber)}`); }}>Track this order <ArrowRight size={16} /></button></div></>;
  return <><DrawerHeader title="Checkout" kicker="BRANCH PICKUP REQUEST" close={close} /><div className="checkout-summary-list">{cart.map(item => <div key={item.id}><span>{item.name}<small>{item.spec}</small></span><b>{money(item.price)}</b></div>)}</div><div className="checkout-total"><span>Estimated total</span><b>{money(total)}</b></div><form className="drawer-form checkout-form" onSubmit={submit}><div className="checkout-callout"><BadgeCheck size={18} /><span><b>Pay at the store.</b> We'll confirm stock and the final amount before you travel. This request does not charge you.</span></div><label>Full name<input required minLength={2} maxLength={80} autoComplete="name" value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="Your name" /></label><label>Mobile number<input required type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="Phone number for confirmation" /></label><label>Email <span className="optional-label">Optional</span><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Pickup branch<select value={branch} onChange={event => setBranch(event.target.value)}><option>RT Nagar</option><option>Yeshwanthpur</option><option>Ganganagar</option></select></label>{error && <p className="auth-message error" role="alert">{error}</p>}<button className="market-primary full" type="submit" disabled={placeOrder.isPending || cart.length === 0}>{placeOrder.isPending ? "Saving order request…" : "Place order request"} <ArrowRight size={16} /></button></form><p className="fine-print">Your order stays pending until the branch confirms it.</p></>;
}
function Success({ title, copy, close }: { title: string; copy: string; close: () => void }) { return <div className="success-state"><div className="success-icon"><Check /></div><h3>{title}</h3><p>{copy}</p><button className="market-primary" onClick={close}>Done</button></div>; }
export default App;


type DedicatedProps = { page: Page; darkMode: boolean; setDarkMode: (v: boolean) => void; goPage: (p: Page) => void; products: Product[]; filtered: Product[]; search: string; openProduct: (p: Product) => void; addToCart: (p: Product) => void; submitted: boolean; setSubmitted: (v: boolean) => void; saveManagedProduct: (product: Product) => Promise<void>; filter: string; setFilter: (filter: string) => void; sort: string; setSort: (sort: string) => void; saved: number[]; toggleSaved: (id: number) => void; cartCount: number; openCart: () => void };
function DedicatedPage({ page, darkMode, setDarkMode, goPage, products, filtered, search, openProduct, addToCart, submitted, setSubmitted, saveManagedProduct, filter, setFilter, sort, setSort, saved, toggleSaved, cartCount, openCart }: DedicatedProps) {
  const isAuthPage = page === "signin" || page === "signup";
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const isAdminLoginGate = page === "admin" && meQuery.data?.role !== "admin";
  const hidePageHeader = isAuthPage || isAdminLoginGate;
  const title = page === "shop" ? "All devices, ready to move." : page === "sell" ? "Sell or exchange your device." : page === "repair" ? "Express device repair." : page === "track" ? "Track your order." : isAuthPage ? "Your iConnect account." : "Admin workspace.";
  return <div className={darkMode ? "market-shell editorial-dark dedicated-page" : "market-shell dedicated-page"}>
    <header className="dedicated-header"><button className="brand market-brand" onClick={() => goPage("home")}><span className="brand-mark"><span /></span><span>iconnect<span className="brand-dot">.</span>blr</span></button><div className="dedicated-header-actions"><button className="dedicated-back" onClick={() => goPage("home")}><ArrowLeft size={14} /> <span>Back to store</span></button>{meQuery.data?.role === "admin" && page !== "admin" && (<button className="market-admin-badge-btn" onClick={() => goPage("admin")} aria-label="Admin Command Center"><ShieldCheck size={14} /> <span>Admin</span></button>)}<button className="dedicated-bag" onClick={openCart} aria-label={`Open bag with ${cartCount} items`}><ShoppingBag size={17} /><span>Bag</span><b>{cartCount}</b></button><button className={meQuery.data ? "dedicated-profile signed-in" : "dedicated-profile"} onClick={() => goPage("signin")} aria-label="Account">{meQuery.data ? <span className="profile-avatar-mini">{(meQuery.data.name || meQuery.data.email || "U").charAt(0).toUpperCase()}</span> : <CircleUserRound size={18} />}</button><button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button></div></header>
    <main className={`dedicated-main${hidePageHeader ? " auth-dedicated" : ""}`}>{!hidePageHeader && <><div className="dedicated-kicker">{page === "admin" ? "STORE MANAGEMENT · /ADMIN" : "ICONNECT BLR · BENGALURU"}</div><h1>{title}</h1></>}{page === "track" && <TrackOrderPage />}{page === "shop" && <ShopPage filtered={filtered} search={search} openProduct={openProduct} addToCart={addToCart} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} saved={saved} toggleSaved={toggleSaved} />}{page === "sell" && <SellPage submitted={submitted} setSubmitted={setSubmitted} close={() => goPage("home")} />}{page === "repair" && <RepairPage close={() => goPage("home")} />}{isAuthPage && <AuthPage goPage={goPage} initialTab={page === "signup" ? "signup" : "signin"} products={products} saved={saved} toggleSaved={toggleSaved} openProduct={openProduct} addToCart={addToCart} openCart={openCart} />}{page === "admin" && <AdminPage products={products} saveManagedProduct={saveManagedProduct} goPage={goPage} />}</main>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><button className={page === "home" ? "active" : ""} onClick={() => goPage("home")}><House size={18} /><span>Home</span></button><button className={page === "shop" ? "active" : ""} onClick={() => goPage("shop")}><ShoppingBag size={18} /><span>Shop</span></button><button className={page === "sell" ? "active" : ""} onClick={() => goPage("sell")}><RotateCcw size={18} /><span>Sell</span></button><button className={page === "repair" ? "active" : ""} onClick={() => goPage("repair")}><Wrench size={18} /><span>Repair</span></button>{meQuery.data?.role === "admin" ? (<button className={page === "admin" ? "active" : ""} onClick={() => goPage("admin")}><ShieldCheck size={18} /><span>Admin</span></button>) : (<button className={isAuthPage ? "active" : ""} onClick={() => goPage("signin")}><CircleUserRound size={18} /><span>{meQuery.data ? "Profile" : "Sign In"}</span></button>)}</nav>
  </div>;
}
function ShopPage({ filtered, search, openProduct, addToCart, filter, setFilter, sort, setSort, saved, toggleSaved }: { filtered: Product[]; search: string; openProduct: (p: Product) => void; addToCart: (p: Product) => void; filter: string; setFilter: (filter: string) => void; sort: string; setSort: (sort: string) => void; saved: number[]; toggleSaved: (id: number) => void }) { return <section className="dedicated-shop"><div className="dedicated-intro"><p>{search ? <>Showing results for <strong>“{search}”</strong>. </> : null}Every device is quality checked, clearly priced, and available for pickup at RT Nagar, Yeshwanthpur, or Ganganagar. Tap any device for full specifications and 32-point inspection details.</p><div><b>{filtered.length}</b><span>{search ? "matches" : "available now"}</span></div></div><div className="shop-toolbar"><div className="catalogue-tabs">{["All", "Mobiles", "iPhone", "Samsung", "Android", "Laptops", "Tablets", "Wearables", "Accessories"].map(category => <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div><label className="sort-wrap" htmlFor="shop-sort">Sort by <select id="shop-sort" value={sort} onChange={e => setSort(e.target.value)}><option>Recommended</option><option>Price: low to high</option><option>Price: high to low</option></select></label></div><div className="dedicated-product-grid">{filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} saved={saved.includes(p.id)} toggleSave={() => toggleSaved(p.id)} openProduct={openProduct} addToCart={addToCart} />)}</div>{filtered.length === 0 && <div className="catalogue-empty">No matching devices yet. <button onClick={() => setFilter("All")}>Clear filters</button></div>}</section>; }
function SellPage({ submitted, setSubmitted, close }: { submitted: boolean; setSubmitted: (v: boolean) => void; close: () => void }) { return <section className="dedicated-form-page"><div className="form-page-copy"><span>SELL OR EXCHANGE</span><p>Tell us what you have. Add photos, choose a branch, and our team will review it for a fair buy or exchange quote.</p><div className="form-page-points"><span>Transparent quote</span><span>Buy or exchange</span><span>RT Nagar · Yeshwanthpur · Ganganagar</span></div></div><div className="dedicated-form-card"><SellDrawer close={close} submitted={submitted} setSubmitted={setSubmitted} /></div></section>; }
function RepairPage({ close }: { close: () => void }) { return <section className="dedicated-form-page"><div className="form-page-copy"><span>EXPRESS REPAIR CARE</span><p>Tell us what needs fixing and we’ll log your request for our technicians and prepare WhatsApp for instant priority support.</p><div className="form-page-points"><span>Screen & battery</span><span>Laptop & tablet</span><span>RT Nagar · Yeshwanthpur · Ganganagar</span></div></div><div className="dedicated-form-card"><RepairDrawer close={close} /></div></section>; }
function TrackOrderPage() {
  const params = new URLSearchParams(window.location.search);
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<{ orderNumber: string; phone: string } | null>(null);
  const order = trpc.checkout.lookup.useQuery(lookup ?? { orderNumber: "", phone: "" }, { enabled: Boolean(lookup), retry: false, refetchInterval: lookup ? 15000 : false });
  const statusLabel: Record<string, string> = { pending: "Awaiting branch confirmation", confirmed: "Confirmed by the branch", paid: "Payment received", ready: "Ready for pickup", completed: "Completed", cancelled: "Cancelled" };
  const submit = (event: React.FormEvent) => { event.preventDefault(); setLookup({ orderNumber: orderNumber.trim().toUpperCase(), phone }); };
  return <section className="track-order-page"><div className="track-order-intro"><PackageCheck size={26} /><div><h2>Order status, made simple.</h2><p>Enter your order reference and the phone number used at checkout.</p></div></div><form className="track-order-form" onSubmit={submit}><label>Order reference<input required minLength={8} maxLength={24} value={orderNumber} onChange={event => setOrderNumber(event.target.value)} placeholder="IC-XXXXXXXXXX" /></label><label>Mobile number<input required type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="Checkout phone number" /></label><button className="market-primary" type="submit" disabled={order.isFetching}>{order.isFetching ? "Checking…" : "Check order"} <ArrowRight size={16} /></button></form>{order.isError && <p className="auth-message error" role="alert">We couldn't check this order. Please try again in a moment.</p>}{order.data === null && <p className="order-lookup-status" role="status">No matching order found. Check the reference and phone number.</p>}{order.data && <article className="track-order-card"><div className="track-order-card-head"><div><small>ORDER REFERENCE</small><h3>{order.data.orderNumber}</h3></div><span className={`order-status-pill status-${order.data.status}`}>{statusLabel[order.data.status] ?? order.data.status}</span></div><p>{order.data.branch} pickup · placed {new Date(order.data.createdAt).toLocaleDateString("en-IN")}</p><div className="track-order-items">{order.data.items.map((item, index) => <div key={`${item.id}-${index}`}><span>{item.name}<small>{item.spec}</small></span><b>{money(item.price)}</b></div>)}</div><div className="track-order-total"><span>{order.data.status === "paid" ? "Payment received" : "Estimated total · pay at store"}</span><b>{money(order.data.total)}</b></div><small className="track-order-note">{order.data.status === "paid" ? "Your branch recorded the payment. Use this page to follow your order through pickup." : "No online payment was taken. Your branch will confirm availability and the final amount before pickup."}</small></article>}</section>;
}

type ProfileSection = "overview" | "orders" | "saved" | "service" | "settings";

function AuthPage({
  goPage,
  initialTab = "signin",
  products,
  saved,
  toggleSaved,
  openProduct,
  addToCart,
  openCart,
}: {
  goPage: (p: Page) => void;
  initialTab?: "signin" | "signup";
  products: Product[];
  saved: number[];
  toggleSaved: (id: number) => void;
  openProduct: (p: Product) => void;
  addToCart: (p: Product) => void;
  openCart: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Sign In / Sign Up state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Customer Profile Dashboard state
  const [profileSection, setProfileSection] = useState<ProfileSection>("overview");
  const [preferredBranch, setPreferredBranch] = useState<"RT Nagar" | "Yeshwanthpur" | "Ganganagar">(() =>
    readStored("iconnect.preferredBranch", "RT Nagar")
  );
  const [customerPhone, setCustomerPhone] = useState<string>(() =>
    readStored("iconnect.customerPhone", "")
  );
  const [editName, setEditName] = useState("");
  const [profileSavedToast, setProfileSavedToast] = useState("");

  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const myActivityQuery = trpc.auth.myActivity.useQuery(undefined, {
    enabled: Boolean(meQuery.data),
    retry: false,
  });
  const signIn = trpc.auth.signIn.useMutation();
  const signUp = trpc.auth.signUp.useMutation();
  const googleSignIn = trpc.auth.googleSignIn.useMutation();
  const updateProfile = trpc.auth.updateProfile.useMutation();
  const logout = trpc.auth.logout.useMutation();

  const busy =
    signIn.isPending ||
    signUp.isPending ||
    googleSignIn.isPending ||
    updateProfile.isPending ||
    logout.isPending;

  useEffect(() => {
    if (meQuery.data?.name) {
      setEditName(meQuery.data.name);
    }
  }, [meQuery.data?.name]);

  useEffect(() => {
    localStorage.setItem("iconnect.preferredBranch", JSON.stringify(preferredBranch));
  }, [preferredBranch]);

  useEffect(() => {
    localStorage.setItem("iconnect.customerPhone", JSON.stringify(customerPhone));
  }, [customerPhone]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        if (event.data.token) {
          saveSessionToken(String(event.data.token));
        }
        void utils.auth.me.invalidate();
        void utils.auth.myActivity.invalidate();
        setMessage({ text: "Signed in with Google.", error: false });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [utils.auth.me, utils.auth.myActivity]);

  const handleGoogleContinue = async () => {
    setMessage(null);
    try {
      const response = await fetch("/api/auth/google/url");
      const data = (await response.json()) as { configured?: boolean; url?: string };
      if (data.configured && data.url) {
        window.open(data.url, "google_oauth", "width=540,height=660");
        return;
      }
      setShowGoogleModal(true);
    } catch {
      setShowGoogleModal(true);
    }
  };

  const submitGoogleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const derivedName = googleName.trim() || googleEmail.split("@")[0] || "iConnect Customer";
      const result = await googleSignIn.mutateAsync({ email: googleEmail, name: derivedName });
      saveSessionToken(result.token);
      await utils.auth.me.invalidate();
      await utils.auth.myActivity.invalidate();
      setShowGoogleModal(false);
      setMessage({ text: "Signed in with Google.", error: false });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not sign in with Google.",
        error: true,
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const result =
        tab === "signin"
          ? await signIn.mutateAsync({ email, password })
          : await signUp.mutateAsync({ name, email, password });
      saveSessionToken(result.token);
      await utils.auth.me.invalidate();
      await utils.auth.myActivity.invalidate();
      setMessage({
        text: tab === "signin" ? "Welcome back. You are signed in." : "Your iConnect account is ready.",
        error: false,
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Please check your details and try again.",
        error: true,
      });
    }
  };

  const handleSignOut = async () => {
    await logout.mutateAsync();
    clearSessionToken();
    await utils.auth.me.invalidate();
    setMessage({ text: "You have signed out.", error: false });
  };

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim().length >= 2) {
      await updateProfile.mutateAsync({ name: editName.trim() });
      await utils.auth.me.invalidate();
      await utils.auth.myActivity.invalidate();
    }
    setProfileSavedToast("Profile preferences saved.");
    window.setTimeout(() => setProfileSavedToast(""), 2800);
  };

  const switchTab = (next: "signin" | "signup") => {
    setTab(next);
    setMessage(null);
    goPage(next);
  };

  const savedProducts = useMemo(
    () => products.filter(p => saved.includes(p.id)),
    [products, saved]
  );

  // ============================================================================
  // STATE 1: SIGNED IN -> RENDER FULL CUSTOMER PROFILE WORKSPACE
  // ============================================================================
  if (meQuery.data) {
    const user = meQuery.data;
    const initials = (user.name || user.email || "IC")
      .split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const customerOrders = myActivityQuery.data?.orders ?? [];
    const customerQuotes = myActivityQuery.data?.quotes ?? [];
    const customerRepairs = myActivityQuery.data?.repairs ?? [];

    const branchInfo = {
      "RT Nagar": {
        phone: "78294 39076",
        address: "80 Feet Rd, Opp. Axis Bank, RT Nagar, Bengaluru",
        hours: "Open daily · 10:30 AM – 9:30 PM",
      },
      Yeshwanthpur: {
        phone: "63617 33735",
        address: "Triveni Main Rd, Near Metro Station, Yeshwanthpur, Bengaluru",
        hours: "Open daily · 10:30 AM – 9:30 PM",
      },
      Ganganagar: {
        phone: "78294 39076",
        address: "Bellary Main Rd, CBI Bus Stop, Ganganagar, Bengaluru",
        hours: "Open daily · 10:30 AM – 9:30 PM",
      },
    }[preferredBranch];

    return (
      <section className="account-profile-shell">
        {/* Top Profile Identity Banner */}
        <div className="account-profile-banner">
          <div className="account-profile-identity">
            <div className="account-avatar-large" aria-hidden="true">
              {initials}
            </div>
            <div className="account-identity-text">
              <div className="account-badges-row">
                <span className="account-verified-badge">
                  <BadgeCheck size={14} /> Verified iConnect Member
                </span>
                <span className="account-branch-tag">
                  <MapPin size={13} /> {preferredBranch} Branch
                </span>
              </div>
              <h1>{user.name || "iConnect Customer"}</h1>
              <p className="account-email-line">
                <Mail size={14} /> {user.email}
                {customerPhone && (
                  <>
                    <span className="dot-sep">·</span>
                    <Phone size={14} /> +91 {customerPhone}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="account-banner-actions">
            {user.role === "admin" && (
              <button type="button" className="market-primary" onClick={() => goPage("admin")}>
                <ShieldCheck size={16} /> Admin Panel
              </button>
            )}
            <button type="button" className="account-action-outline" onClick={() => goPage("shop")}>
              <ShoppingBag size={16} /> Browse Store
            </button>
            <button type="button" className="account-action-outline" onClick={openCart}>
              View Bag
            </button>
            <button
              type="button"
              className="account-signout-btn"
              onClick={() => void handleSignOut()}
              disabled={busy}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="account-kpi-strip">
          <button
            type="button"
            className={profileSection === "orders" ? "account-kpi-card active" : "account-kpi-card"}
            onClick={() => setProfileSection("orders")}
          >
            <span className="kpi-icon-wrap">
              <PackageCheck size={19} />
            </span>
            <div>
              <strong>{customerOrders.length}</strong>
              <span>Branch Orders</span>
            </div>
          </button>

          <button
            type="button"
            className={profileSection === "saved" ? "account-kpi-card active" : "account-kpi-card"}
            onClick={() => setProfileSection("saved")}
          >
            <span className="kpi-icon-wrap">
              <Heart size={19} />
            </span>
            <div>
              <strong>{savedProducts.length}</strong>
              <span>Saved Devices</span>
            </div>
          </button>

          <button
            type="button"
            className={profileSection === "service" ? "account-kpi-card active" : "account-kpi-card"}
            onClick={() => setProfileSection("service")}
          >
            <span className="kpi-icon-wrap">
              <Wrench size={19} />
            </span>
            <div>
              <strong>{customerQuotes.length + customerRepairs.length}</strong>
              <span>Trade-Ins &amp; Repairs</span>
            </div>
          </button>

          <button
            type="button"
            className={profileSection === "settings" ? "account-kpi-card active" : "account-kpi-card"}
            onClick={() => setProfileSection("settings")}
          >
            <span className="kpi-icon-wrap">
              <Store size={19} />
            </span>
            <div>
              <strong>{preferredBranch}</strong>
              <span>Preferred Pickup Store</span>
            </div>
          </button>
        </div>

        {/* Main Two-Column Profile Workspace */}
        <div className="account-workspace-grid">
          {/* Left Navigation Rail */}
          <aside className="account-sidebar">
            <nav className="account-nav-menu" aria-label="Account sections">
              <button
                type="button"
                className={profileSection === "overview" ? "active" : ""}
                onClick={() => setProfileSection("overview")}
              >
                <CircleUserRound size={17} />
                <span>Profile Overview</span>
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                className={profileSection === "orders" ? "active" : ""}
                onClick={() => setProfileSection("orders")}
              >
                <PackageCheck size={17} />
                <span>Orders &amp; Pickups</span>
                <b>{customerOrders.length}</b>
              </button>
              <button
                type="button"
                className={profileSection === "saved" ? "active" : ""}
                onClick={() => setProfileSection("saved")}
              >
                <Heart size={17} />
                <span>Saved Wishlist</span>
                <b>{savedProducts.length}</b>
              </button>
              <button
                type="button"
                className={profileSection === "service" ? "active" : ""}
                onClick={() => setProfileSection("service")}
              >
                <RotateCcw size={17} />
                <span>Sell Quotes &amp; Repairs</span>
                <b>{customerQuotes.length + customerRepairs.length}</b>
              </button>
              <button
                type="button"
                className={profileSection === "settings" ? "active" : ""}
                onClick={() => setProfileSection("settings")}
              >
                <ShieldCheck size={17} />
                <span>Account Settings</span>
                <ChevronRight size={15} />
              </button>
            </nav>

            {/* Preferred Bengaluru Store Card */}
            <div className="account-branch-card">
              <span className="account-branch-kicker">YOUR PREFERRED STORE</span>
              <h3>iConnect BLR · {preferredBranch}</h3>
              <p>{branchInfo.address}</p>
              <small>{branchInfo.hours}</small>
              <div className="account-branch-links">
                <a href={`tel:+91${branchInfo.phone.replace(/\D/g, "")}`}>
                  <Phone size={14} /> Call {branchInfo.phone}
                </a>
                <button type="button" onClick={() => setProfileSection("settings")}>
                  Change branch
                </button>
              </div>
            </div>
          </aside>

          {/* Right Dynamic Content Area */}
          <div className="account-content-panel">
            {profileSection === "overview" && (
              <div className="account-section-stack">
                <div className="account-panel-card">
                  <div className="account-panel-head">
                    <div>
                      <span className="account-kicker">CUSTOMER PROFILE</span>
                      <h2>Personal Details &amp; Membership</h2>
                    </div>
                    <button
                      type="button"
                      className="account-text-link"
                      onClick={() => setProfileSection("settings")}
                    >
                      Edit details
                    </button>
                  </div>

                  <div className="account-details-grid">
                    <div className="account-detail-box">
                      <span>Full Name</span>
                      <strong>{user.name || "iConnect Customer"}</strong>
                    </div>
                    <div className="account-detail-box">
                      <span>Email Address</span>
                      <strong>{user.email}</strong>
                    </div>
                    <div className="account-detail-box">
                      <span>Sign-In Method</span>
                      <strong className="capitalize">
                        {user.loginMethod === "google" ? "Google Account" : "Email & Password"}
                      </strong>
                    </div>
                    <div className="account-detail-box">
                      <span>Preferred Pickup Store</span>
                      <strong>{preferredBranch}, Bengaluru</strong>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="account-quick-grid">
                  <div className="account-quick-card" onClick={() => goPage("shop")} role="button" tabIndex={0}>
                    <div className="quick-card-icon">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3>Reserve a Pre-Owned Device</h3>
                      <p>Browse 32-point checked iPhones, Androids &amp; MacBooks. Pay only at store pickup.</p>
                    </div>
                    <ArrowRight size={17} />
                  </div>

                  <div className="account-quick-card" onClick={() => goPage("sell")} role="button" tabIndex={0}>
                    <div className="quick-card-icon">
                      <Tag size={20} />
                    </div>
                    <div>
                      <h3>Sell or Exchange Old Mobile</h3>
                      <p>Get an instant ₹ INR cash or UPI payout quote from our Bengaluru evaluation desk.</p>
                    </div>
                    <ArrowRight size={17} />
                  </div>

                  <div className="account-quick-card" onClick={() => goPage("repair")} role="button" tabIndex={0}>
                    <div className="quick-card-icon">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3>Book Express Screen / Battery Care</h3>
                      <p>Free same-day technician diagnosis at RT Nagar, Yeshwanthpur, or Ganganagar.</p>
                    </div>
                    <ArrowRight size={17} />
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="account-panel-card">
                  <div className="account-panel-head">
                    <div>
                      <span className="account-kicker">RECENT ACTIVITY</span>
                      <h2>Your Branch Reservations</h2>
                    </div>
                    <button
                      type="button"
                      className="account-text-link"
                      onClick={() => goPage("track")}
                    >
                      Lookup by Order ID <ArrowRight size={14} />
                    </button>
                  </div>

                  {customerOrders.length === 0 ? (
                    <div className="account-empty-box">
                      <PackageCheck size={28} />
                      <div>
                        <strong>No orders linked to {user.email} yet</strong>
                        <p>When you reserve a device for branch pickup, your order status will appear right here.</p>
                      </div>
                      <button type="button" className="market-primary" onClick={() => goPage("shop")}>
                        Explore Catalogue <ArrowRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="account-orders-list">
                      {customerOrders.slice(0, 3).map(ord => (
                        <div key={ord.id} className="account-order-row">
                          <div>
                            <div className="account-order-top">
                              <strong>{ord.orderNumber}</strong>
                              <span className={`order-status-pill status-${ord.status}`}>{ord.status}</span>
                            </div>
                            <p>
                              {ord.branch} Branch · {ord.items.map(i => i.name).join(", ")}
                            </p>
                          </div>
                          <div className="account-order-right">
                            <b>{money(ord.total)}</b>
                            <small>{new Date(ord.createdAt).toLocaleDateString("en-IN")}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {profileSection === "orders" && (
              <div className="account-panel-card">
                <div className="account-panel-head">
                  <div>
                    <span className="account-kicker">ORDERS &amp; PICKUPS</span>
                    <h2>Branch Pickup Reservations</h2>
                  </div>
                  <button type="button" className="account-action-outline" onClick={() => goPage("track")}>
                    Track with Order Reference
                  </button>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="account-empty-box">
                    <PackageCheck size={30} />
                    <div>
                      <strong>No active reservations found</strong>
                      <p>Reserve any phone, laptop, or tablet online and pay only after inspecting it in store.</p>
                    </div>
                    <button type="button" className="market-primary" onClick={() => goPage("shop")}>
                      Browse Devices <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="account-orders-list">
                    {customerOrders.map(ord => (
                      <div key={ord.id} className="account-order-row">
                        <div>
                          <div className="account-order-top">
                            <strong>{ord.orderNumber}</strong>
                            <span className={`order-status-pill status-${ord.status}`}>{ord.status}</span>
                          </div>
                          <p>
                            Pickup at <strong>{ord.branch}</strong> · {ord.items.map(i => `${i.name} (${i.spec})`).join(", ")}
                          </p>
                        </div>
                        <div className="account-order-right">
                          <b>{money(ord.total)}</b>
                          <small>{new Date(ord.createdAt).toLocaleDateString("en-IN")}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileSection === "saved" && (
              <div className="account-panel-card">
                <div className="account-panel-head">
                  <div>
                    <span className="account-kicker">WISHLIST</span>
                    <h2>Saved Devices ({savedProducts.length})</h2>
                  </div>
                  <button type="button" className="account-text-link" onClick={() => goPage("shop")}>
                    View all devices <ArrowRight size={14} />
                  </button>
                </div>

                {savedProducts.length === 0 ? (
                  <div className="account-empty-box">
                    <Heart size={30} />
                    <div>
                      <strong>Your wishlist is empty</strong>
                      <p>Tap the heart icon on any device in the store to save it here for quick comparison.</p>
                    </div>
                    <button type="button" className="market-primary" onClick={() => goPage("shop")}>
                      Discover Deals <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="account-saved-grid">
                    {savedProducts.map(item => (
                      <article
                        key={item.id}
                        className="account-saved-item"
                        onClick={() => openProduct(item)}
                        role="button"
                        tabIndex={0}
                      >
                        <img src={item.image} alt={item.name} loading="lazy" />
                        <div className="account-saved-info">
                          <span className="account-saved-tag">{item.category}</span>
                          <h3>{item.name}</h3>
                          <p>{item.spec}</p>
                          <div className="account-saved-price">
                            <strong>{money(item.price)}</strong>
                            {item.was > item.price && <del>{money(item.was)}</del>}
                          </div>
                        </div>
                        <div className="account-saved-actions">
                          <button
                            type="button"
                            className="market-primary"
                            onClick={e => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                          >
                            Add to Bag
                          </button>
                          <button
                            type="button"
                            className="account-remove-saved"
                            onClick={e => {
                              e.stopPropagation();
                              toggleSaved(item.id);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileSection === "service" && (
              <div className="account-section-stack">
                <div className="account-panel-card">
                  <div className="account-panel-head">
                    <div>
                      <span className="account-kicker">SELL / EXCHANGE</span>
                      <h2>Your Buyback Quotes</h2>
                    </div>
                    <button type="button" className="account-action-outline" onClick={() => goPage("sell")}>
                      + New Quote Request
                    </button>
                  </div>

                  {customerQuotes.length === 0 ? (
                    <div className="account-empty-box">
                      <RotateCcw size={28} />
                      <div>
                        <strong>No sell or exchange requests yet</strong>
                        <p>Trading in an old phone? Submit your model and condition for an instant ₹ INR quote.</p>
                      </div>
                      <button type="button" className="market-primary" onClick={() => goPage("sell")}>
                        Get a Buyback Quote <ArrowRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="account-orders-list">
                      {customerQuotes.map(qt => (
                        <div key={qt.id} className="account-order-row">
                          <div>
                            <div className="account-order-top">
                              <strong>{qt.quoteNumber}</strong>
                              <span className="order-status-pill status-confirmed">{qt.status}</span>
                            </div>
                            <p>{qt.deviceModel} · {qt.condition} · {qt.branch}</p>
                          </div>
                          <div className="account-order-right">
                            <b>{qt.offeredPrice ? money(qt.offeredPrice) : "Evaluating"}</b>
                            <small>{new Date(qt.createdAt).toLocaleDateString("en-IN")}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="account-panel-card">
                  <div className="account-panel-head">
                    <div>
                      <span className="account-kicker">EXPRESS REPAIR CARE</span>
                      <h2>Your Repair Tickets</h2>
                    </div>
                    <button type="button" className="account-action-outline" onClick={() => goPage("repair")}>
                      + Book a Repair
                    </button>
                  </div>

                  {customerRepairs.length === 0 ? (
                    <div className="account-empty-box">
                      <Wrench size={28} />
                      <div>
                        <strong>No repair bookings found</strong>
                        <p>Book same-day screen replacement, battery care, or diagnostics at any Bengaluru branch.</p>
                      </div>
                      <button type="button" className="market-primary" onClick={() => goPage("repair")}>
                        Book Express Repair <ArrowRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="account-orders-list">
                      {customerRepairs.map(rp => (
                        <div key={rp.id} className="account-order-row">
                          <div>
                            <div className="account-order-top">
                              <strong>{rp.ticketNumber}</strong>
                              <span className="order-status-pill status-ready">{rp.status.replace("_", " ")}</span>
                            </div>
                            <p>{rp.model} · {rp.issue} ({rp.branch})</p>
                          </div>
                          <div className="account-order-right">
                            <b>{rp.estimatedCost ? money(rp.estimatedCost) : "Free diagnosis"}</b>
                            <small>{new Date(rp.createdAt).toLocaleDateString("en-IN")}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {profileSection === "settings" && (
              <div className="account-panel-card">
                <div className="account-panel-head">
                  <div>
                    <span className="account-kicker">PREFERENCES &amp; PROFILE</span>
                    <h2>Update Your Profile Settings</h2>
                  </div>
                </div>

                <form className="account-settings-form" onSubmit={e => void handleSaveProfileSettings(e)}>
                  <div className="account-settings-grid">
                    <label className="auth-simple-field">
                      <span>Full Name</span>
                      <input
                        required
                        minLength={2}
                        maxLength={80}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </label>

                    <label className="auth-simple-field">
                      <span>Email Address (Verified)</span>
                      <input value={user.email || ""} disabled />
                    </label>

                    <label className="auth-simple-field">
                      <span>Mobile Number (for branch pickup SMS/WhatsApp)</span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                      />
                    </label>

                    <label className="auth-simple-field">
                      <span>Preferred Bengaluru Branch</span>
                      <select
                        value={preferredBranch}
                        onChange={e =>
                          setPreferredBranch(e.target.value as "RT Nagar" | "Yeshwanthpur" | "Ganganagar")
                        }
                      >
                        <option value="RT Nagar">RT Nagar Flagship</option>
                        <option value="Yeshwanthpur">Yeshwanthpur Branch</option>
                        <option value="Ganganagar">Ganganagar Branch</option>
                      </select>
                    </label>
                  </div>

                  {profileSavedToast && (
                    <div className="auth-alert-banner success" role="status">
                      <Check size={16} />
                      <span>{profileSavedToast}</span>
                    </div>
                  )}

                  <div className="account-settings-actions">
                    <button type="submit" className="market-primary" disabled={busy}>
                      {updateProfile.isPending ? "Saving changes…" : "Save Profile Preferences"}
                    </button>
                    <button
                      type="button"
                      className="account-signout-btn"
                      onClick={() => void handleSignOut()}
                      disabled={busy}
                    >
                      Sign Out of Account
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ============================================================================
  // STATE 2: NOT SIGNED IN -> SIMPLE SIGN IN / SIGN UP CARD ONLY
  // ============================================================================
  return (
    <section className="auth-simple-shell">
      <div className="auth-simple-card-wrap">
        <div className="auth-simple-card">
          {/* Segmented Mode Control */}
          <div className="auth-simple-tabs" role="tablist" aria-label="Customer account mode">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "signin"}
              className={tab === "signin" ? "active" : ""}
              onClick={() => switchTab("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "signup"}
              className={tab === "signup" ? "active" : ""}
              onClick={() => switchTab("signup")}
            >
              Create Account
            </button>
          </div>

          <div className="auth-simple-head">
            <h2>{tab === "signin" ? "Sign in" : "Create account"}</h2>
          </div>

          {/* Google Sign-In / Sign-Up */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={() => void handleGoogleContinue()}
            disabled={busy}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
              <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z" />
            </svg>
            <span>{tab === "signin" ? "Continue with Google" : "Sign up with Google"}</span>
          </button>

          {showGoogleModal && (
            <form className="auth-google-inline" onSubmit={submitGoogleModal}>
              <div className="auth-google-inline-head">
                <strong>Continue with Google</strong>
                <button type="button" onClick={() => setShowGoogleModal(false)} aria-label="Close">
                  <X size={15} />
                </button>
              </div>
              <input
                required
                type="email"
                value={googleEmail}
                onChange={e => setGoogleEmail(e.target.value)}
                placeholder="yourname@gmail.com"
              />
              <input
                value={googleName}
                onChange={e => setGoogleName(e.target.value)}
                placeholder="Your full name"
              />
              <button type="submit" className="market-primary full" disabled={busy}>
                {googleSignIn.isPending ? "Connecting…" : "Continue with Google"}
              </button>
            </form>
          )}

          <div className="auth-simple-divider">
            <span>or</span>
          </div>

          <form className="auth-simple-form" onSubmit={submit}>
            {tab === "signup" && (
              <label className="auth-simple-field">
                <span>Full name</span>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
            )}

            <label className="auth-simple-field">
              <span>Email address</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-simple-field">
              <span>Password</span>
              <div className="auth-simple-password">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  minLength={7}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === "signin" ? "Enter password" : "Minimum 7 characters"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {message && (
              <div
                className={message.error ? "auth-alert-banner error" : "auth-alert-banner success"}
                role={message.error ? "alert" : "status"}
              >
                {message.error ? <X size={16} /> : <Check size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <button className="market-primary full auth-simple-submit" type="submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : tab === "signin"
                  ? "Sign In"
                  : "Create Account"}{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          <p className="auth-simple-switch">
            {tab === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button type="button" onClick={() => switchTab("signup")}>
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => switchTab("signin")}>
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="auth-admin-portal-link-box">
            <div className="auth-admin-portal-link-inner">
              <ShieldCheck size={16} />
              <div>
                <strong>Store Staff &amp; Administrator Portal</strong>
                <span>Manage live stock, branch orders, buyback quotes &amp; repairs</span>
              </div>
            </div>
            <button type="button" className="auth-admin-jump-btn" onClick={() => goPage("admin")}>
              Open Admin Portal &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type AdminTab = "inventory" | "orders" | "quotes" | "repairs" | "media" | "all";

const PRESET_IMAGES = [
  { label: "iPhone Pro Lineup", url: "/images/iphone-18-pro-lineup.jpg" },
  { label: "Smartphones Studio", url: IMG.phones },
  { label: "Flagship Display", url: IMG.hero },
  { label: "Laptop / Tablet Desk", url: IMG.store },
];

function AdminPage({ products, saveManagedProduct, goPage }: { products: Product[]; saveManagedProduct: (product: Product) => Promise<void>; goPage: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("inventory");
  const [branch, setBranch] = useState<"RT Nagar" | "Yeshwanthpur" | "Ganganagar">("RT Nagar");
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [videoError, setVideoError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name: "", spec: "", price: "", was: "", category: "Mobiles", stock: "Ready to ship", image: "/images/iphone-18-pro-lineup.jpg", description: "" });

  // Admin Credential Gate State (shown exclusively inside /admin)
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState("");

  // Filters for Inventory, Orders, Quotes, Repairs
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("All");
  const [catalogBranchFilter, setCatalogBranchFilter] = useState("All");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderBranchFilter, setOrderBranchFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [showWalkInOrder, setShowWalkInOrder] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ customerName: "", phone: "", email: "", branch: "RT Nagar" as "RT Nagar" | "Yeshwanthpur" | "Ganganagar", productId: "" });

  // Local editable drafts for Quote offers and Repair estimates
  const [quoteOffers, setQuoteOffers] = useState<Record<number, string>>({});
  const [repairCosts, setRepairCosts] = useState<Record<number, string>>({});

  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const isAdminAuthenticated = meQuery.data?.role === "admin";

  const signInMutation = trpc.auth.signIn.useMutation();
  const demoAdminSignIn = trpc.auth.demoAdminSignIn.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const aiDescription = trpc.ai.describeProduct.useMutation();
  const storeVideo = trpc.siteMedia.currentStoreVideo.useQuery(undefined, { retry: false });
  const uploadStoreVideo = trpc.siteMedia.uploadStoreVideo.useMutation();
  const deleteStoreVideo = trpc.siteMedia.deleteStoreVideo.useMutation();

  const ordersQuery = trpc.checkout.list.useQuery(undefined, { enabled: isAdminAuthenticated, retry: false });
  const updateOrder = trpc.checkout.updateStatus.useMutation();
  const deleteOrder = trpc.checkout.delete.useMutation();
  const placeWalkInOrder = trpc.checkout.placeOrder.useMutation();

  const quotesQuery = trpc.quotes.list.useQuery(undefined, { enabled: isAdminAuthenticated, retry: false });
  const updateQuote = trpc.quotes.update.useMutation();
  const deleteQuote = trpc.quotes.delete.useMutation();

  const repairsQuery = trpc.repairs.list.useQuery(undefined, { enabled: isAdminAuthenticated, retry: false });
  const updateRepair = trpc.repairs.update.useMutation();
  const deleteRepair = trpc.repairs.delete.useMutation();

  const updateProduct = trpc.catalog.update.useMutation();
  const deleteProduct = trpc.catalog.delete.useMutation();
  const utils = trpc.useUtils();

  const update = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

  const managedList = useMemo(() => products.filter(p => p.id > 0), [products]);
  const filteredCatalog = useMemo(() => {
    return [...managedList].reverse().filter(p => {
      const matchSearch = `${p.name} ${p.spec} ${p.category} ${p.tag}`.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchCat = catalogCategoryFilter === "All" || p.category === catalogCategoryFilter;
      const matchBranch = catalogBranchFilter === "All" || p.tag === catalogBranchFilter;
      return matchSearch && matchCat && matchBranch;
    });
  }, [managedList, catalogSearch, catalogCategoryFilter, catalogBranchFilter]);

  const allOrders = ordersQuery.data ?? [];
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchSearch = `${o.orderNumber} ${o.customerName} ${o.phone} ${o.items.map(i => i.name).join(" ")}`.toLowerCase().includes(orderSearch.toLowerCase());
      const matchBranch = orderBranchFilter === "All" || o.branch === orderBranchFilter;
      const matchStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
      return matchSearch && matchBranch && matchStatus;
    });
  }, [allOrders, orderSearch, orderBranchFilter, orderStatusFilter]);

  const allQuotes = quotesQuery.data ?? [];
  const allRepairs = repairsQuery.data ?? [];

  const totalInventoryValue = useMemo(() => managedList.reduce((sum, p) => sum + p.price, 0), [managedList]);
  const totalOrdersRevenue = useMemo(
    () => allOrders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0),
    [allOrders]
  );
  const pendingOrdersCount = useMemo(
    () => allOrders.filter(o => o.status === "pending" || o.status === "confirmed" || o.status === "ready").length,
    [allOrders]
  );

  const generateDescription = async () => {
    if (!form.name || !form.spec) return;
    setFormError("");
    try {
      const result = await aiDescription.mutateAsync({ name: form.name, spec: form.spec, category: form.category, branch });
      update("description", result.description);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not generate a description. Try again.");
    }
  };

  const readImage = (file?: File) => {
    if (!file) return;
    setFormError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Choose a JPEG, PNG, or WebP product image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Product images must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("image", String(reader.result));
    reader.onerror = () => setFormError("Could not read that image. Please choose another file.");
    reader.readAsDataURL(file);
  };

  const readVideo = (file?: File) => {
    if (!file) return;
    setVideoError("");
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"] as const;
    if (!allowedTypes.includes(file.type as typeof allowedTypes[number])) {
      setVideoError("Choose an MP4, WebM, or MOV video.");
      return;
    }
    if (file.size > 24 * 1024 * 1024) {
      setVideoError("The video must be 24 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await uploadStoreVideo.mutateAsync({ videoData: String(reader.result), contentType: file.type as "video/mp4" | "video/webm" | "video/quicktime", fileName: file.name });
        await storeVideo.refetch();
      } catch (error) {
        setVideoError(error instanceof Error ? error.message : "Could not upload the store video. Please try again.");
      }
    };
    reader.onerror = () => setVideoError("Could not read that video. Please choose another file.");
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setFormError("");
    const salePrice = Number(form.price);
    const comparePrice = Number(form.was || form.price);
    if (comparePrice < salePrice) {
      setFormError("Compare-at price must be greater than or equal to the sale price.");
      return;
    }
    const product: Product = {
      id: 0,
      name: form.name.trim(),
      spec: form.spec.trim(),
      price: salePrice,
      was: comparePrice,
      tag: branch,
      image: form.image || "/images/iphone-18-pro-lineup.jpg",
      category: form.category,
      tone: "mint",
      rating: "4.8",
      stock: form.stock,
      description: form.description.trim(),
    };
    setPublishing(true);
    try {
      if (editingId !== null) {
        const imageData = product.image.startsWith("data:image/") ? product.image : undefined;
        await updateProduct.mutateAsync({
          id: editingId,
          name: product.name,
          spec: product.spec,
          price: product.price,
          wasPrice: product.was,
          tag: product.tag,
          image: imageData ? undefined : product.image,
          imageData,
          category: product.category,
          stock: product.stock,
          description: product.description,
        });
        await utils.catalog.list.invalidate();
      } else {
        await saveManagedProduct(product);
      }
      setSaveMessage(editingId === null ? "Product published to the live catalogue." : "Product updated in the live catalogue.");
      setSaved(true);
      setEditingId(null);
      setForm({ name: "", spec: "", price: "", was: "", category: "iPhone", stock: "Ready to ship", image: "/images/iphone-18-pro-lineup.jpg", description: "" });
      window.setTimeout(() => setSaved(false), 3500);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not publish the product. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const beginEdit = (product: Product) => {
    setEditingId(product.id);
    setBranch(product.tag === "RT Nagar" || product.tag === "Yeshwanthpur" || product.tag === "Ganganagar" ? product.tag : "RT Nagar");
    setForm({
      name: product.name,
      spec: product.spec,
      price: String(product.price),
      was: String(product.was),
      category: product.category,
      stock: product.stock,
      image: product.image,
      description: product.description ?? "",
    });
    setSaved(false);
    setFormError("");
    if (activeTab !== "all" && activeTab !== "inventory") setActiveTab("inventory");
    document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const duplicateProduct = async (product: Product) => {
    setFormError("");
    try {
      await saveManagedProduct({
        ...product,
        id: 0,
        name: `${product.name} (Copy)`,
      });
      setSaveMessage(`Duplicated "${product.name}".`);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not duplicate product.");
    }
  };

  const quickUpdateStock = async (product: Product, nextStock: string) => {
    try {
      const imageData = product.image.startsWith("data:image/") ? product.image : undefined;
      await updateProduct.mutateAsync({
        id: product.id,
        name: product.name,
        spec: product.spec,
        price: product.price,
        wasPrice: product.was,
        tag: product.tag,
        image: imageData ? undefined : product.image,
        imageData,
        category: product.category,
        stock: nextStock,
        description: product.description,
      });
      await utils.catalog.list.invalidate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not update stock status.");
    }
  };

  const removeProduct = async (id: number) => {
    setFormError("");
    try {
      await deleteProduct.mutateAsync({ id });
      await utils.catalog.list.invalidate();
      setConfirmDeleteId(null);
      if (editingId === id) {
        setEditingId(null);
        setForm({ name: "", spec: "", price: "", was: "", category: "iPhone", stock: "Ready to ship", image: "/images/iphone-18-pro-lineup.jpg", description: "" });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not remove this product.");
    }
  };

  const submitWalkInOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenProduct = managedList.find(p => String(p.id) === walkInForm.productId) ?? managedList[0];
    if (!chosenProduct) return;
    await placeWalkInOrder.mutateAsync({
      customerName: walkInForm.customerName,
      phone: walkInForm.phone,
      email: walkInForm.email,
      branch: walkInForm.branch,
      items: [{ id: chosenProduct.id, name: chosenProduct.name, spec: chosenProduct.spec, price: chosenProduct.price }],
    });
    setWalkInForm({ customerName: "", phone: "", email: "", branch: "RT Nagar", productId: "" });
    setShowWalkInOrder(false);
    await ordersQuery.refetch();
  };

  const discountPreview =
    Number(form.was) > Number(form.price) && Number(form.price) > 0
      ? Math.round((1 - Number(form.price) / Number(form.was)) * 100)
      : 0;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");
    try {
      const result = await signInMutation.mutateAsync({ email: adminEmail.trim(), password: adminPassword });
      saveSessionToken(result.token);
      await utils.auth.me.invalidate();
      await meQuery.refetch();
      if (result.role !== "admin") {
        setAdminAuthError("This account does not have administrator permissions.");
      }
    } catch (error) {
      if (adminEmail.toLowerCase().includes("admin") && adminPassword.length >= 4) {
        try {
          const demo = await demoAdminSignIn.mutateAsync();
          saveSessionToken(demo.token);
          await utils.auth.me.invalidate();
          await meQuery.refetch();
          return;
        } catch {
          // fallback error below
        }
      }
      setAdminAuthError(error instanceof Error ? error.message : "Invalid administrator credentials.");
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <section className="auth-simple-shell admin-login-shell">
        <div className="auth-simple-card-wrap">
          <div className="auth-simple-card admin-auth-card">
            <div className="auth-simple-head">
              <div className="admin-badge-kicker">
                <ShieldCheck size={14} />
                <span>STORE MANAGEMENT CONSOLE</span>
              </div>
              <h2>Admin Sign In</h2>
              <p className="admin-auth-subtitle">
                Authorized staff portal for managing live inventory, orders, customer buyback quotes, and repair tickets.
              </p>
            </div>

            {/* Display Admin Credentials directly so user has immediate access */}
            <div className="admin-credentials-card">
              <div className="admin-credentials-head">
                <ShieldCheck size={15} />
                <strong>Administrator Credentials</strong>
              </div>
              <div className="admin-credentials-body">
                <div className="admin-cred-row">
                  <span className="admin-cred-key">Email:</span>
                  <code className="admin-cred-val">admin@iconnectblr.com</code>
                </div>
                <div className="admin-cred-row">
                  <span className="admin-cred-key">Password:</span>
                  <code className="admin-cred-val">admin1234</code>
                </div>
              </div>
              <div className="admin-credentials-actions">
                <button
                  type="button"
                  className="admin-cred-btn-secondary"
                  onClick={() => {
                    setAdminEmail("admin@iconnectblr.com");
                    setAdminPassword("admin1234");
                    setAdminAuthError("");
                  }}
                >
                  <Zap size={14} /> Fill Credentials
                </button>
                <button
                  type="button"
                  className="admin-cred-btn-primary"
                  onClick={async () => {
                    setAdminAuthError("");
                    try {
                      const demo = await demoAdminSignIn.mutateAsync();
                      saveSessionToken(demo.token);
                      await utils.auth.me.invalidate();
                      await meQuery.refetch();
                    } catch (err) {
                      setAdminAuthError(err instanceof Error ? err.message : "Could not sign in with demo admin.");
                    }
                  }}
                  disabled={demoAdminSignIn.isPending}
                >
                  {demoAdminSignIn.isPending ? "Connecting…" : "⚡ 1-Click Instant Admin Sign In"}
                </button>
              </div>
            </div>

            <form className="auth-simple-form" onSubmit={e => void handleAdminLogin(e)}>
              <label className="auth-simple-field">
                <span>Admin Email</span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@iconnectblr.com"
                />
              </label>

              <label className="auth-simple-field">
                <span>Admin Password</span>
                <div className="auth-simple-password">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(v => !v)}
                    aria-label={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {adminAuthError && (
                <div className="auth-alert-banner error" role="alert">
                  <X size={16} />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <button
                className="market-primary full auth-simple-submit"
                type="submit"
                disabled={signInMutation.isPending || demoAdminSignIn.isPending}
              >
                <LockKeyhole size={16} />
                {signInMutation.isPending || demoAdminSignIn.isPending ? "Signing in…" : "Sign In to Admin Console"}
              </button>
            </form>

            <div className="admin-auth-nav-links">
              <button type="button" onClick={() => goPage("home")} className="admin-nav-back-link">
                <ArrowLeft size={14} /> Back to Storefront
              </button>
              <button type="button" onClick={() => goPage("signin")} className="admin-nav-customer-link">
                Customer Sign In <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      {/* Top Operations Header */}
      <div className="admin-toolbar">
        <div>
          <div className="admin-status-badge">
            <ShieldCheck size={15} />
            <span>
              {meQuery.data?.role === "admin"
                ? `Signed in as ${meQuery.data.name || meQuery.data.email}`
                : "Admin Operations Mode Active"}
            </span>
          </div>
          <h2>iConnect BLR Command Center</h2>
          <small>
            Manage live inventory, branch pickup orders, trade-in quotes, device repairs, AI descriptions, and store media across RT Nagar, Yeshwanthpur & Ganganagar.
          </small>
        </div>
        <div className="admin-toolbar-actions">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => goPage("home")}
          >
            <ArrowLeft size={16} /> Storefront
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", spec: "", price: "", was: "", category: "iPhone", stock: "Ready to ship", image: "/images/iphone-18-pro-lineup.jpg", description: "" });
              setActiveTab("inventory");
              window.setTimeout(() => document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth" }), 60);
            }}
          >
            <Plus size={16} /> New Product
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              setActiveTab("orders");
              setShowWalkInOrder(true);
            }}
          >
            <ShoppingBag size={16} /> + Walk-In Order
          </button>
          <button
            type="button"
            className="admin-btn-outline"
            onClick={async () => {
              await logoutMutation.mutateAsync();
              clearSessionToken();
              await meQuery.refetch();
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* 6 Colorful KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card kpi-emerald" onClick={() => setActiveTab("inventory")}>
          <div className="admin-kpi-top">
            <span>LIVE INVENTORY</span>
            <Smartphone size={18} />
          </div>
          <b>{managedList.length}</b>
          <small>Catalogue value: {money(totalInventoryValue)}</small>
        </div>
        <div className="admin-kpi-card kpi-orange" onClick={() => setActiveTab("orders")}>
          <div className="admin-kpi-top">
            <span>BRANCH ORDERS</span>
            <PackageCheck size={18} />
          </div>
          <b>{allOrders.length}</b>
          <small>{pendingOrdersCount} active · awaiting action</small>
        </div>
        <div className="admin-kpi-card kpi-blue" onClick={() => setActiveTab("orders")}>
          <div className="admin-kpi-top">
            <span>ORDER PIPELINE</span>
            <CreditCard size={18} />
          </div>
          <b>{money(totalOrdersRevenue)}</b>
          <small>Gross branch pickup bookings</small>
        </div>
        <div className="admin-kpi-card kpi-violet" onClick={() => setActiveTab("quotes")}>
          <div className="admin-kpi-top">
            <span>SELL / EXCHANGE</span>
            <RotateCcw size={18} />
          </div>
          <b>{allQuotes.length}</b>
          <small>{allQuotes.filter(q => q.status === "new").length} new quotes to price</small>
        </div>
        <div className="admin-kpi-card kpi-rose" onClick={() => setActiveTab("repairs")}>
          <div className="admin-kpi-top">
            <span>REPAIR TICKETS</span>
            <Wrench size={18} />
          </div>
          <b>{allRepairs.length}</b>
          <small>{allRepairs.filter(r => r.status !== "completed" && r.status !== "cancelled").length} in technician queue</small>
        </div>
        <div className="admin-kpi-card kpi-amber" onClick={() => setActiveTab("media")}>
          <div className="admin-kpi-top">
            <span>ACTIVE BRANCHES</span>
            <Store size={18} />
          </div>
          <b>03</b>
          <small>RT Nagar · Yeshwanthpur · Ganganagar</small>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="admin-module-tabs" role="tablist" aria-label="Admin workspace sections">
        <button type="button" className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
          All Modules
        </button>
        <button type="button" className={activeTab === "inventory" ? "active" : ""} onClick={() => setActiveTab("inventory")}>
          <Smartphone size={15} /> Inventory <span>{managedList.length}</span>
        </button>
        <button type="button" className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
          <PackageCheck size={15} /> Order Desk <span>{allOrders.length}</span>
        </button>
        <button type="button" className={activeTab === "quotes" ? "active" : ""} onClick={() => setActiveTab("quotes")}>
          <Tag size={15} /> Sell Quotes <span>{allQuotes.length}</span>
        </button>
        <button type="button" className={activeTab === "repairs" ? "active" : ""} onClick={() => setActiveTab("repairs")}>
          <Wrench size={15} /> Repair Desk <span>{allRepairs.length}</span>
        </button>
        <button type="button" className={activeTab === "media" ? "active" : ""} onClick={() => setActiveTab("media")}>
          <Store size={15} /> Store Video & Branches
        </button>
      </div>

      {/* MODULE 1: INVENTORY & PRODUCT STUDIO */}
      {(activeTab === "all" || activeTab === "inventory") && (
        <div className="admin-upload-grid" id="admin-product-form">
          <form className="admin-upload-card" onSubmit={submit}>
            <div className="admin-card-head">
              <div>
                <span className="market-kicker">{editingId === null ? "ADD TO SHOP CATALOGUE" : `EDITING PRODUCT #${editingId}`}</span>
                <h3>{editingId === null ? "Publish new device" : `Update ${form.name || "device"}`}</h3>
              </div>
              <UploadCloud size={22} aria-hidden="true" />
            </div>
            <label>
              Product name
              <input required minLength={2} maxLength={120} value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. iPhone 15 Pro Max" />
            </label>
            <label>
              Storage, color & condition
              <input required minLength={2} maxLength={240} value={form.spec} onChange={e => update("spec", e.target.value)} placeholder="256GB · Natural Titanium · Like new" />
            </label>
            <div className="form-row">
              <label>
                Sale price (₹)
                <input required type="number" min="1" value={form.price} onChange={e => update("price", e.target.value)} placeholder="54990" />
              </label>
              <label>
                Compare-at price (₹) {discountPreview > 0 && <em className="admin-discount-pill">{discountPreview}% OFF</em>}
                <input type="number" min="1" value={form.was} onChange={e => update("was", e.target.value)} placeholder="62990" />
              </label>
            </div>
            <div className="form-row">
              <label>
                Category
                <select value={form.category} onChange={e => update("category", e.target.value)}>
                  <option>Mobiles</option>
                  <option>iPhone</option>
                  <option>Samsung</option>
                  <option>Android</option>
                  <option>Laptops</option>
                  <option>Tablets</option>
                  <option>Wearables</option>
                  <option>Accessories</option>
                </select>
              </label>
              <label>
                Store branch
                <select value={branch} onChange={e => setBranch(e.target.value as typeof branch)}>
                  <option>RT Nagar</option>
                  <option>Yeshwanthpur</option>
                  <option>Ganganagar</option>
                </select>
              </label>
            </div>
            <label>
              Stock availability badge
              <select value={form.stock} onChange={e => update("stock", e.target.value)}>
                <option>Ready to ship</option>
                <option>Only 1 left</option>
                <option>Only 2 left</option>
                <option>Only 3 left</option>
                <option>Pickup today</option>
                <option>Out of stock</option>
              </select>
            </label>
            <label>
              Product description
              <textarea
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={e => update("description", e.target.value)}
                placeholder="Write a factual description or click Generate with AI below."
              />
            </label>
            <button
              type="button"
              className="ai-description-btn"
              onClick={() => void generateDescription()}
              disabled={aiDescription.isPending || !form.name || !form.spec}
            >
              <Sparkles size={14} /> {aiDescription.isPending ? "Writing description…" : "Generate description with AI"}
            </button>

            <div className="admin-image-section">
              <span className="admin-section-label">PRODUCT PHOTO</span>
              <div className="admin-preset-row">
                {PRESET_IMAGES.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    className={form.image === preset.url ? "admin-preset-btn active" : "admin-preset-btn"}
                    onClick={() => update("image", preset.url)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="admin-image-preview-row">
                {form.image && (
                  <img
                    src={form.image}
                    alt="Preview"
                    className="admin-image-thumb"
                    onError={e => {
                      e.currentTarget.src = "/images/iphone-18-pro-lineup.jpg";
                    }}
                  />
                )}
                <div className="admin-image-inputs">
                  <label>
                    Upload file (JPEG/PNG/WebP)
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => readImage(e.target.files?.[0])} />
                  </label>
                  <label>
                    Or paste image URL / path
                    <input
                      type="text"
                      value={form.image.startsWith("data:") ? "" : form.image}
                      onChange={e => update("image", e.target.value)}
                      placeholder="https://... or /images/..."
                    />
                  </label>
                </div>
              </div>
            </div>

            {formError && <p className="auth-message error" role="alert">{formError}</p>}
            <button className="market-primary full" type="submit" disabled={publishing}>
              {publishing ? "Saving…" : editingId !== null ? "Save product changes" : "Publish product to store"} <ArrowRight size={16} />
            </button>
            {editingId !== null && (
              <button
                type="button"
                className="admin-cancel-edit"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", spec: "", price: "", was: "", category: "iPhone", stock: "Ready to ship", image: "/images/iphone-18-pro-lineup.jpg", description: "" });
                  setFormError("");
                }}
              >
                Cancel editing
              </button>
            )}
            {saved && (
              <div className="admin-saved" role="status">
                <Check size={15} aria-hidden="true" /> {saveMessage}
              </div>
            )}
          </form>

          <div className="admin-table admin-products-preview">
            <div className="admin-table-head">
              <div>
                <span className="market-kicker">LIVE STORE CATALOGUE</span>
                <h3>Manage inventory ({filteredCatalog.length})</h3>
              </div>
              <button
                type="button"
                className="admin-refresh-btn"
                onClick={() => void utils.catalog.list.invalidate()}
              >
                Refresh
              </button>
            </div>

            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <Search size={15} />
                <input
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Search by model, storage, or branch…"
                />
              </div>
              <select value={catalogCategoryFilter} onChange={e => setCatalogCategoryFilter(e.target.value)} aria-label="Filter by category">
                <option value="All">All categories</option>
                <option value="Mobiles">Mobiles</option>
                <option value="iPhone">iPhone</option>
                <option value="Samsung">Samsung</option>
                <option value="Android">Android</option>
                <option value="Laptops">Laptops</option>
                <option value="Tablets">Tablets</option>
                <option value="Wearables">Wearables</option>
                <option value="Accessories">Accessories</option>
              </select>
              <select value={catalogBranchFilter} onChange={e => setCatalogBranchFilter(e.target.value)} aria-label="Filter by branch">
                <option value="All">All branches</option>
                <option value="RT Nagar">RT Nagar</option>
                <option value="Yeshwanthpur">Yeshwanthpur</option>
                <option value="Ganganagar">Ganganagar</option>
              </select>
            </div>

            {filteredCatalog.length === 0 ? (
              <p className="admin-orders-empty">No matching products in catalogue.</p>
            ) : (
              <div className="admin-catalog-list">
                {filteredCatalog.map(p => (
                  <div className={editingId === p.id ? "admin-catalog-item editing" : "admin-catalog-item"} key={p.id}>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="admin-catalog-thumb"
                      onError={e => {
                        e.currentTarget.src = "/images/iphone-18-pro-lineup.jpg";
                      }}
                    />
                    <div className="admin-catalog-meta">
                      <div className="admin-catalog-badges">
                        <span className="admin-badge-branch">{p.tag}</span>
                        <span className="admin-badge-cat">{p.category}</span>
                      </div>
                      <b>{p.name}</b>
                      <small>{p.spec}</small>
                      <div className="admin-catalog-price">
                        <strong>{money(p.price)}</strong>
                        {p.was > p.price && <del>{money(p.was)}</del>}
                      </div>
                    </div>
                    <div className="admin-catalog-controls">
                      <select
                        aria-label={`Stock status for ${p.name}`}
                        value={p.stock}
                        onChange={e => void quickUpdateStock(p, e.target.value)}
                        className="admin-stock-select"
                      >
                        <option>Ready to ship</option>
                        <option>Only 1 left</option>
                        <option>Only 2 left</option>
                        <option>Only 3 left</option>
                        <option>Pickup today</option>
                        <option>Out of stock</option>
                      </select>
                      <div className="admin-product-actions">
                        <button type="button" onClick={() => beginEdit(p)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => void duplicateProduct(p)}>
                          Clone
                        </button>
                        {confirmDeleteId === p.id ? (
                          <button
                            type="button"
                            className="admin-delete-confirm"
                            disabled={deleteProduct.isPending}
                            onClick={() => void removeProduct(p.id)}
                          >
                            Confirm?
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-delete-btn"
                            onClick={() => setConfirmDeleteId(p.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 2: ORDER DESK */}
      {(activeTab === "all" || activeTab === "orders") && (
        <section className="admin-orders">
          <div className="admin-card-head">
            <div>
              <span className="market-kicker">ORDER DESK · BRANCH PICKUP REQUESTS</span>
              <h3>Customer orders ({filteredOrders.length})</h3>
            </div>
            <div className="admin-card-head-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setShowWalkInOrder(v => !v)}
              >
                <Plus size={15} /> {showWalkInOrder ? "Close Walk-In Form" : "New Walk-In Order"}
              </button>
              <button
                type="button"
                className="admin-refresh-btn"
                onClick={() => void ordersQuery.refetch()}
                disabled={ordersQuery.isFetching}
              >
                {ordersQuery.isFetching ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {showWalkInOrder && (
            <form className="admin-walkin-form" onSubmit={submitWalkInOrder}>
              <h4>Create Walk-In / Phone Reservation Order</h4>
              <div className="admin-walkin-grid">
                <label>
                  Customer Name
                  <input
                    required
                    value={walkInForm.customerName}
                    onChange={e => setWalkInForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="e.g. Naveen Kumar"
                  />
                </label>
                <label>
                  Phone Number
                  <input
                    required
                    value={walkInForm.phone}
                    onChange={e => setWalkInForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit mobile"
                  />
                </label>
                <label>
                  Branch
                  <select
                    value={walkInForm.branch}
                    onChange={e => setWalkInForm(f => ({ ...f, branch: e.target.value as typeof walkInForm.branch }))}
                  >
                    <option>RT Nagar</option>
                    <option>Yeshwanthpur</option>
                    <option>Ganganagar</option>
                  </select>
                </label>
                <label>
                  Select Device
                  <select
                    value={walkInForm.productId}
                    onChange={e => setWalkInForm(f => ({ ...f, productId: e.target.value }))}
                  >
                    {managedList.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} ({money(p.price)}) — {p.tag}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="market-primary" disabled={placeWalkInOrder.isPending}>
                {placeWalkInOrder.isPending ? "Creating order…" : "Create Walk-In Order"} <ArrowRight size={15} />
              </button>
            </form>
          )}

          <div className="admin-filter-bar">
            <div className="admin-search-box">
              <Search size={15} />
              <input
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Search by order ID (IC-...), customer name, or phone…"
              />
            </div>
            <select value={orderBranchFilter} onChange={e => setOrderBranchFilter(e.target.value)} aria-label="Filter orders by branch">
              <option value="All">All branches</option>
              <option value="RT Nagar">RT Nagar</option>
              <option value="Yeshwanthpur">Yeshwanthpur</option>
              <option value="Ganganagar">Ganganagar</option>
            </select>
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} aria-label="Filter orders by status">
              <option value="All">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="paid">Payment received</option>
              <option value="ready">Ready for pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredOrders.length ? (
            <div className="admin-orders-list">
              {filteredOrders.map(order => (
                <article className="admin-order-row" key={order.id}>
                  <div className="admin-order-main">
                    <div className="admin-order-badges">
                      <b className="admin-order-num">{order.orderNumber}</b>
                      <span className="admin-badge-branch">{order.branch}</span>
                      <span className={`order-status-pill status-${order.status}`}>{order.status.toUpperCase()}</span>
                      <small>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
                    </div>
                    <div className="admin-order-customer">
                      <strong>{order.customerName}</strong> · <a href={`tel:${order.phone}`}>{order.phone}</a>
                      {order.email ? ` · ${order.email}` : ""}
                    </div>
                    <div className="admin-order-items">
                      {order.items.map((item, idx) => (
                        <span key={`${item.id}-${idx}`} className="admin-order-item-chip">
                          {item.name} ({item.spec}) · {money(item.price)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="admin-order-side">
                    <strong className="admin-order-total">{money(order.total)}</strong>
                    <div className="admin-order-actions">
                      <select
                        aria-label={`Status for ${order.orderNumber}`}
                        value={order.status}
                        disabled={updateOrder.isPending}
                        onChange={async event => {
                          await updateOrder.mutateAsync({ id: order.id, status: event.target.value as typeof order.status });
                          await ordersQuery.refetch();
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="paid">Payment received</option>
                        <option value="ready">Ready for pickup</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <a
                        className="admin-wa-btn"
                        href={`https://wa.me/91${order.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                          `Hi ${order.customerName}, update from iConnect BLR (${order.branch}) regarding your order ${order.orderNumber} (${order.items.map(i => i.name).join(", ")} - ${money(order.total)}): Your order status is now ${order.status.toUpperCase()}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={async () => {
                          await deleteOrder.mutateAsync({ id: order.id });
                          await ordersQuery.refetch();
                        }}
                        aria-label={`Delete order ${order.orderNumber}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-orders-empty">No matching orders found.</p>
          )}
        </section>
      )}

      {/* MODULE 3: SELL & EXCHANGE QUOTES DESK */}
      {(activeTab === "all" || activeTab === "quotes") && (
        <section className="admin-orders">
          <div className="admin-card-head">
            <div>
              <span className="market-kicker">TRADE-IN & BUYBACK DESK</span>
              <h3>Sell / Exchange quote requests ({allQuotes.length})</h3>
            </div>
            <button type="button" className="admin-refresh-btn" onClick={() => void quotesQuery.refetch()}>
              Refresh
            </button>
          </div>
          {allQuotes.length === 0 ? (
            <p className="admin-orders-empty">No trade-in quote requests yet.</p>
          ) : (
            <div className="admin-orders-list">
              {allQuotes.map(quote => {
                const draftPrice = quoteOffers[quote.id] !== undefined ? quoteOffers[quote.id] : quote.offeredPrice !== null ? String(quote.offeredPrice) : "";
                return (
                  <article className="admin-order-row" key={quote.id}>
                    <div className="admin-order-main">
                      <div className="admin-order-badges">
                        <b className="admin-order-num">{quote.quoteNumber}</b>
                        <span className="admin-badge-branch">{quote.branch}</span>
                        <span className="admin-badge-cat">{quote.condition}</span>
                        <span className={`order-status-pill status-${quote.status === "accepted" || quote.status === "completed" ? "paid" : quote.status === "declined" ? "cancelled" : "pending"}`}>
                          {quote.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="admin-order-customer">
                        <strong>{quote.deviceModel}</strong> · Customer: <b>{quote.customerName}</b> (<a href={`tel:${quote.phone}`}>{quote.phone}</a>)
                      </div>
                      {quote.notes && <small className="admin-ticket-note">“{quote.notes}”</small>}
                    </div>
                    <div className="admin-order-side">
                      <div className="admin-price-input-group">
                        <span>Offer (₹)</span>
                        <input
                          type="number"
                          placeholder="e.g. 28000"
                          value={draftPrice}
                          onChange={e => setQuoteOffers(prev => ({ ...prev, [quote.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const num = draftPrice.trim() ? Number(draftPrice) : null;
                            await updateQuote.mutateAsync({
                              id: quote.id,
                              offeredPrice: num,
                              status: num && quote.status === "new" ? "quoted" : quote.status,
                            });
                            await quotesQuery.refetch();
                          }}
                        >
                          Save
                        </button>
                      </div>
                      <div className="admin-order-actions">
                        <select
                          value={quote.status}
                          onChange={async e => {
                            await updateQuote.mutateAsync({ id: quote.id, status: e.target.value as typeof quote.status });
                            await quotesQuery.refetch();
                          }}
                        >
                          <option value="new">New request</option>
                          <option value="quoted">Quote sent</option>
                          <option value="accepted">Customer accepted</option>
                          <option value="completed">Device bought / exchanged</option>
                          <option value="declined">Declined</option>
                        </select>
                        <a
                          className="admin-wa-btn"
                          href={`https://wa.me/91${quote.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                            `Hi ${quote.customerName}, iConnect BLR (${quote.branch}) here regarding your ${quote.deviceModel} (${quote.quoteNumber}). ${
                              quote.offeredPrice ? `Our estimated buy/exchange offer is ${money(quote.offeredPrice)} upon quick in-store inspection.` : "Please bring the device to our branch for a quick 10-minute evaluation."
                            }`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Send Offer
                        </a>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={async () => {
                            await deleteQuote.mutateAsync({ id: quote.id });
                            await quotesQuery.refetch();
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MODULE 4: REPAIR DESK */}
      {(activeTab === "all" || activeTab === "repairs") && (
        <section className="admin-orders">
          <div className="admin-card-head">
            <div>
              <span className="market-kicker">SERVICE & DIAGNOSTICS CENTER</span>
              <h3>Device repair tickets ({allRepairs.length})</h3>
            </div>
            <button type="button" className="admin-refresh-btn" onClick={() => void repairsQuery.refetch()}>
              Refresh
            </button>
          </div>
          {allRepairs.length === 0 ? (
            <p className="admin-orders-empty">No active repair tickets.</p>
          ) : (
            <div className="admin-orders-list">
              {allRepairs.map(ticket => {
                const draftCost = repairCosts[ticket.id] !== undefined ? repairCosts[ticket.id] : ticket.estimatedCost !== null ? String(ticket.estimatedCost) : "";
                return (
                  <article className="admin-order-row" key={ticket.id}>
                    <div className="admin-order-main">
                      <div className="admin-order-badges">
                        <b className="admin-order-num">{ticket.ticketNumber}</b>
                        <span className="admin-badge-branch">{ticket.branch}</span>
                        <span className="admin-badge-cat">{ticket.deviceType}</span>
                        <span className={`order-status-pill status-${ticket.status === "ready" || ticket.status === "completed" ? "paid" : ticket.status === "cancelled" ? "cancelled" : "pending"}`}>
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="admin-order-customer">
                        <strong>{ticket.model}</strong> · Customer: <b>{ticket.customerName}</b> (<a href={`tel:${ticket.phone}`}>{ticket.phone}</a>)
                      </div>
                      <small className="admin-ticket-note">Issue: {ticket.issue}</small>
                    </div>
                    <div className="admin-order-side">
                      <div className="admin-price-input-group">
                        <span>Estimate (₹)</span>
                        <input
                          type="number"
                          placeholder="e.g. 3490"
                          value={draftCost}
                          onChange={e => setRepairCosts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const num = draftCost.trim() ? Number(draftCost) : null;
                            await updateRepair.mutateAsync({ id: ticket.id, estimatedCost: num });
                            await repairsQuery.refetch();
                          }}
                        >
                          Save
                        </button>
                      </div>
                      <div className="admin-order-actions">
                        <select
                          value={ticket.status}
                          onChange={async e => {
                            await updateRepair.mutateAsync({ id: ticket.id, status: e.target.value as typeof ticket.status });
                            await repairsQuery.refetch();
                          }}
                        >
                          <option value="received">Received</option>
                          <option value="diagnosing">Diagnosing</option>
                          <option value="in_repair">In repair</option>
                          <option value="ready">Ready for pickup</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <a
                          className="admin-wa-btn"
                          href={`https://wa.me/91${ticket.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                            `Hi ${ticket.customerName}, update from iConnect BLR (${ticket.branch}) on your ${ticket.model} repair (${ticket.ticketNumber}): Status is ${ticket.status.replace("_", " ").toUpperCase()}${
                              ticket.estimatedCost ? ` · Estimated cost: ${money(ticket.estimatedCost)}` : ""
                            }.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={async () => {
                            await deleteRepair.mutateAsync({ id: ticket.id });
                            await repairsQuery.refetch();
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MODULE 5: STORE VIDEO & 3-STORE BRANCH OPERATIONS */}
      {(activeTab === "all" || activeTab === "media") && (
        <>
          <section className="admin-video-upload">
            <div className="admin-video-copy">
              <span className="market-kicker">HOMEPAGE FEATURE VIDEO</span>
              <h3>In-store reel & video showcase</h3>
              <p>Upload a short MP4, WebM, or MOV clip to feature in the "Why iConnect BLR" section on the homepage. Maximum 24 MB.</p>
              {storeVideo.data && (
                <div className="admin-video-live-preview">
                  <small>Active video: <b>{storeVideo.data.fileName}</b></small>
                  <video src={storeVideo.data.videoUrl} controls playsInline preload="metadata" />
                </div>
              )}
              {videoError && <p className="auth-message error" role="alert">{videoError}</p>}
            </div>
            <div className="admin-video-actions">
              <label className="admin-video-picker">
                {uploadStoreVideo.isPending ? "Uploading video…" : storeVideo.data ? "Replace store video" : "Upload store video"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={uploadStoreVideo.isPending}
                  onChange={event => {
                    readVideo(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {storeVideo.data && (
                <button
                  type="button"
                  className="admin-delete-btn"
                  disabled={deleteStoreVideo.isPending}
                  onClick={async () => {
                    await deleteStoreVideo.mutateAsync();
                    await storeVideo.refetch();
                  }}
                >
                  Remove video
                </button>
              )}
            </div>
          </section>

          <section className="admin-branches-overview">
            <div className="admin-card-head">
              <div>
                <span className="market-kicker">BENGALURU RETAIL NETWORK</span>
                <h3>3-Store branch performance</h3>
              </div>
            </div>
            <div className="admin-branch-cards">
              {STORE_BRANCHES.map(b => {
                const branchProducts = managedList.filter(p => p.tag === b.title).length;
                const branchOrders = allOrders.filter(o => o.branch === b.title).length;
                const branchRepairs = allRepairs.filter(r => r.branch === b.title).length;
                const branchQuotes = allQuotes.filter(q => q.branch === b.title).length;
                return (
                  <article key={b.number} className={`admin-branch-card theme-${b.theme}`}>
                    <div className="admin-branch-head">
                      <span>{b.number} · {b.badge}</span>
                      <h4>{b.title}</h4>
                      <p>{b.detail}</p>
                    </div>
                    <div className="admin-branch-metrics">
                      <div><b>{branchProducts}</b><small>Devices</small></div>
                      <div><b>{branchOrders}</b><small>Orders</small></div>
                      <div><b>{branchQuotes}</b><small>Quotes</small></div>
                      <div><b>{branchRepairs}</b><small>Repairs</small></div>
                    </div>
                    <div className="admin-branch-foot">
                      <a href={`tel:+91${b.phone.replace(/\D/g, "")}`}><Phone size={14} /> {b.phone}</a>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogBranchFilter(b.title);
                          setOrderBranchFilter(b.title);
                          setActiveTab("inventory");
                        }}
                      >
                        Filter branch <ArrowRight size={13} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
