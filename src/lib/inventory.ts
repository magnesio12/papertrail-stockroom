import { useEffect, useState } from "react";

export const CATEGORIES = ["Material escolar", "Oficina", "Manualidades", "Regalo"] as const;
export type Category = (typeof CATEGORIES)[number];
export const SUPPLIERS: [string, string, string] = [
  "Papelería Central S.L.",
  "Distribuciones Escolares Martínez",
  "Suministros de Oficina García",
];

export type Product = {
  id: string;
  name: string;
  category: Category;
  stock: number;
  threshold: number;
  supplier: string;
};
export type Movement = {
  id: string;
  productId: string;
  type: "entrada" | "salida";
  qty: number;
  date: string;
  note: string;
};

// Demo access key (no backend; documented on the login screen)
export const ACCESS_KEY = "papeleria2026";

const PKEY = "superpapeleria.products";
const MKEY = "superpapeleria.movements";
const AKEY = "superpapeleria.session";

const [C, D, G] = SUPPLIERS;
const seed: [string, Category, number, number, string][] = [
  ["Cuaderno cuadriculado A4", "Material escolar", 48, 20, C],
  ["Estuche completo escolar", "Material escolar", 6, 8, D],
  ["Papel de regalo", "Regalo", 25, 10, C],
  ["Bolígrafo azul", "Oficina", 120, 40, G],
  ["Lápices de colores 24 unidades", "Material escolar", 14, 15, D],
  ["Goma de borrar", "Material escolar", 60, 25, D],
  ["Sacapuntas metálico", "Material escolar", 9, 12, D],
  ["Mochila escolar", "Material escolar", 7, 5, D],
  ["Carpeta archivadora", "Oficina", 22, 10, G],
  ["Tijeras escolares", "Material escolar", 18, 10, D],
  ["Pegamento en barra", "Material escolar", 11, 15, C],
  ["Pinturas acuarelas", "Manualidades", 12, 6, C],
  ["Pincel plano Nº8", "Manualidades", 4, 6, C],
  ["Bloc de dibujo", "Manualidades", 16, 8, C],
  ["Cinta adhesiva transparente", "Oficina", 30, 12, G],
  ["Bolsa de regalo mediana", "Regalo", 19, 10, C],
  ["Grapadora de sobremesa", "Oficina", 5, 4, G],
  ["Agenda escolar 2026-2027", "Material escolar", 35, 15, D],
];

// Detects whether the browser allows localStorage (it can be disabled by
// the user or by privacy settings); used to show a warning in the UI.
export function storageAvailable(): boolean {
  try {
    localStorage.setItem("__sp_test", "1");
    localStorage.removeItem("__sp_test");
    return true;
  } catch {
    return false;
  }
}

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  const v = fallback();
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
  return v;
}

export const isLow = (p: Product) => p.stock <= p.threshold;
const uid = () => Math.random().toString(36).slice(2, 10);

export function useInventory() {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [authed, setAuthed] = useState(false);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    setProducts(
      load(PKEY, () =>
        seed.map(([name, category, stock, threshold, supplier]) => ({
          id: uid(), name, category, stock, threshold, supplier,
        })),
      ),
    );
    setMovements(load<Movement[]>(MKEY, () => []));
    try {
      setAuthed(sessionStorage.getItem(AKEY) === "1" || localStorage.getItem(AKEY) === "1");
    } catch {}
    setStorageOk(storageAvailable());
    setReady(true);
  }, []);

  const saveP = (p: Product[]) => { setProducts(p); try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch {} };
  const saveM = (m: Movement[]) => { setMovements(m); try { localStorage.setItem(MKEY, JSON.stringify(m)); } catch {} };

  return {
    ready, products, movements, authed, storageOk,
    login(key: string, remember: boolean) {
      if (key !== ACCESS_KEY) return false;
      try {
        (remember ? localStorage : sessionStorage).setItem(AKEY, "1");
      } catch {}
      setAuthed(true);
      return true;
    },
    logout() {
      try {
        localStorage.removeItem(AKEY);
        sessionStorage.removeItem(AKEY);
      } catch {}
      setAuthed(false);
    },
    addProduct(p: Omit<Product, "id">) {
      saveP([{ ...p, id: uid() }, ...products]);
    },
    move(productId: string, type: Movement["type"], qty: number, note: string) {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return "Producto no encontrado";
      if (type === "salida" && qty > prod.stock) return `Solo quedan ${prod.stock} unidades`;
      saveP(products.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + (type === "entrada" ? qty : -qty) } : p,
      ));
      saveM([{ id: uid(), productId, type, qty, note, date: new Date().toISOString() }, ...movements].slice(0, 200));
      return null;
    },
  };
}
