import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CATEGORIES, SUPPLIERS, ACCESS_KEY, isLow, useInventory,
  type Category, type Product, type Movement,
} from "@/lib/inventory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "La Superpapelería · Inventario y pedidos" },
      { name: "description", content: "Control de stock de La Superpapelería: alertas de artículos que se acaban, entradas de proveedor y ventas." },
      { property: "og:title", content: "La Superpapelería · Inventario" },
      { property: "og:description", content: "Mira de un vistazo qué artículos escolares se están acabando antes de la vuelta al cole." },
    ],
  }),
  component: App,
});

type Tab = "lista" | "movimiento" | "alta" | "historial" | "info";

function App() {
  const inv = useInventory();
  const [tab, setTab] = useState<Tab>("lista");
  const [preselect, setPreselect] = useState<{ id: string; type: Movement["type"] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  if (!inv.ready) return <div className="min-h-screen bg-primary" />;
  if (!inv.authed) return <Login onLogin={inv.login} />;

  const low = inv.products.filter(isLow).length;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo />
            <div>
              <h1 className="text-lg font-black leading-none">La Superpapelería</h1>
              <p className="text-xs opacity-75">Inventario de la tienda</p>
            </div>
          </div>
          <button onClick={inv.logout} className="rounded-lg border border-primary-foreground/30 px-3 py-1.5 text-sm hover:bg-primary-foreground/10">
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        {!inv.storageOk && (
          <div className="mb-4 rounded-xl border-2 border-destructive bg-alert-bg px-4 py-3 text-sm font-medium text-destructive">
            ⚠ Tu navegador tiene el almacenamiento local deshabilitado: los datos no se guardarán al cerrar la página.
          </div>
        )}
        {tab === "lista" && (
          <ProductList
            products={inv.products}
            lowCount={low}
            onMove={(id, type) => { setPreselect({ id, type }); setTab("movimiento"); }}
          />
        )}
        {tab === "movimiento" && (
          <MovementForm
            key={preselect?.id ?? "x"}
            products={inv.products}
            preselect={preselect}
            onSubmit={(id, type, qty, note) => {
              const err = inv.move(id, type, qty, note);
              if (!err) {
                const p = inv.products.find((x) => x.id === id)!;
                flash(`${type === "entrada" ? "+" : "−"}${qty} · ${p.name}`);
                setPreselect(null);
                setTab("lista");
              }
              return err;
            }}
          />
        )}
        {tab === "alta" && (
          <NewProduct onSubmit={(p) => { inv.addProduct(p); flash(`Añadido: ${p.name}`); setTab("lista"); }} />
        )}
        {tab === "historial" && <History movements={inv.movements} products={inv.products} />}
        {tab === "info" && <BusinessInfo />}
      </main>

      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-sm rounded-xl bg-deep px-4 py-3 text-center text-sm font-medium text-primary-foreground shadow-lg">
          {toast}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {([
            ["lista", "Stock", "▦"],
            ["movimiento", "Entrada/Salida", "⇅"],
            ["alta", "Nuevo", "+"],
            ["historial", "Historial", "↺"],
            ["info", "Info", "ℹ"],
          ] as [Tab, string, string][]).map(([t, label, icon]) => (
            <button
              key={t}
              onClick={() => { setPreselect(null); setTab(t); }}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${tab === t ? "text-primary" : "text-muted-foreground"}`}
            >
              {tab === t && <span className="absolute top-0 h-1 w-10 rounded-b bg-secondary" />}
              <span className="text-xl leading-none">{icon}</span>
              {label}
              {t === "lista" && low > 0 && (
                <span className="absolute right-[22%] top-1.5 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">{low}</span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary font-display text-lg font-black text-secondary-foreground">
      S
    </div>
  );
}

function Login({ onLogin }: { onLogin: (k: string, r: boolean) => boolean }) {
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return setErr("Escribe la clave de acceso");
    if (!onLogin(key.trim(), remember)) setErr("Clave incorrecta. Inténtalo de nuevo.");
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-5 text-primary-foreground">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 rotate-[-4deg] place-items-center rounded-2xl bg-secondary font-display text-3xl font-black text-secondary-foreground shadow-lg">S</div>
        <h1 className="text-3xl font-black">La Superpapelería</h1>
        <p className="mt-1 text-sm opacity-75">Tu papelería de barrio · Panel de inventario</p>
      </div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
        <label className="block">
          <span className="text-sm font-semibold">Clave de acceso</span>
          <input
            type="password" autoFocus value={key}
            onChange={(e) => { setKey(e.target.value); setErr(""); }}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
        </label>
        {err && <p className="text-sm font-medium text-destructive">{err}</p>}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />
          Recordar en este dispositivo
        </label>
        <button className="w-full rounded-xl bg-secondary py-3 font-display text-base font-extrabold text-secondary-foreground hover:brightness-95">
          Entrar
        </button>
        <p className="text-center text-xs text-muted-foreground">Clave de demostración: <b>{ACCESS_KEY}</b></p>
      </form>
    </div>
  );
}

function ProductList({ products, lowCount, onMove }: {
  products: Product[]; lowCount: number; onMove: (id: string, t: Movement["type"]) => void;
}) {
  const [cat, setCat] = useState<Category | "Todas">("Todas");
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const list = useMemo(() =>
    products
      .filter((p) => (cat === "Todas" || p.category === cat) && (!onlyLow || isLow(p)) && p.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.name.localeCompare(b.name)),
  [products, cat, q, onlyLow]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOnlyLow(!onlyLow)}
        className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ${lowCount ? "bg-secondary text-secondary-foreground" : "bg-card"} border`}
      >
        <div>
          <p className="font-display text-2xl font-black">{lowCount} {lowCount === 1 ? "artículo" : "artículos"} por reponer</p>
          <p className="text-sm opacity-80">de {products.length} productos en tienda</p>
        </div>
        <span className="rounded-lg bg-card/70 px-3 py-1.5 text-sm font-semibold">{onlyLow ? "Ver todos" : "Ver solo alertas"}</span>
      </button>

      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artículo…"
        className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["Todas", ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No hay artículos con estos filtros.</p>}
      <ul className="space-y-2.5">
        {list.map((p) => {
          const low = isLow(p);
          return (
            <li key={p.id} className={`rounded-2xl border-2 p-4 ${low ? "border-destructive bg-alert-bg" : "border-transparent bg-card shadow-sm"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{p.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.category} · {p.supplier}</p>
                  {low && <p className="mt-1 text-xs font-bold text-destructive">⚠ Stock bajo · avisa a partir de {p.threshold}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-display text-3xl font-black leading-none ${low ? "text-destructive" : "text-primary"}`}>{p.stock}</p>
                  <p className="text-[11px] text-muted-foreground">uds.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => onMove(p.id, "entrada")} className="rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">+ Entrada</button>
                <button onClick={() => onMove(p.id, "salida")} className="rounded-lg border border-primary bg-card py-2 text-sm font-semibold text-primary">− Venta</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring";

function Field({ label, error, children }: { label: string; error?: string | undefined; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}

function MovementForm({ products, preselect, onSubmit }: {
  products: Product[];
  preselect: { id: string; type: Movement["type"] } | null;
  onSubmit: (id: string, t: Movement["type"], qty: number, note: string) => string | null;
}) {
  const [type, setType] = useState<Movement["type"]>(preselect?.type ?? "entrada");
  const [id, setId] = useState(preselect?.id ?? "");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const prod = products.find((p) => p.id === id);
  const n = parseInt(qty, 10);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!id) return setErr("Elige un producto");
    if (!Number.isInteger(n) || n <= 0) return setErr("La cantidad debe ser un número mayor que 0");
    const r = onSubmit(id, type, n, note.trim().slice(0, 120));
    if (r) setErr(r);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-black">Movimiento de stock</h2>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(["entrada", "salida"] as const).map((t) => (
          <button type="button" key={t} onClick={() => setType(t)}
            className={`rounded-lg py-2.5 text-sm font-bold ${type === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
            {t === "entrada" ? "Entrada (proveedor)" : "Salida (venta)"}
          </button>
        ))}
      </div>
      <Field label="Producto">
        <select value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} className={inputCls}>
          <option value="">Selecciona un artículo…</option>
          {[...products].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>
          ))}
        </select>
      </Field>
      <Field label="Cantidad">
        <input inputMode="numeric" type="number" min={1} value={qty} onChange={(e) => { setQty(e.target.value); setErr(""); }} className={inputCls} placeholder="Ej. 12" />
      </Field>
      <Field label={type === "entrada" ? "Albarán o nota (opcional)" : "Nota (opcional)"}>
        <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} className={inputCls}
          placeholder={type === "entrada" ? "Albarán nº 2381" : "Venta mostrador"} />
      </Field>
      {prod && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          Stock actual: <b>{prod.stock}</b>
          {Number.isInteger(n) && n > 0 && <> → quedará en <b>{prod.stock + (type === "entrada" ? n : -n)}</b></>}
          <span className="block text-xs text-muted-foreground">Proveedor: {prod.supplier} · Alerta en {prod.threshold}</span>
        </div>
      )}
      {err && <p className="text-sm font-medium text-destructive">{err}</p>}
      <button className="w-full rounded-xl bg-secondary py-3.5 font-display text-base font-extrabold text-secondary-foreground">
        {type === "entrada" ? "Registrar entrada" : "Registrar venta"}
      </button>
    </form>
  );
}

function NewProduct({ onSubmit }: { onSubmit: (p: Omit<Product, "id">) => void }) {
  const [f, setF] = useState({ name: "", category: "", stock: "", threshold: "", supplier: "" });
  const [errs, setErrs] = useState<Partial<Record<"name" | "category" | "stock" | "threshold" | "supplier", string>>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setErrs({ ...errs, [k]: "" }); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<"name" | "category" | "stock" | "threshold" | "supplier", string>> = {};
    const name = f.name.trim();
    if (!name) er.name = "El nombre es obligatorio";
    else if (name.length > 80) er.name = "Máximo 80 caracteres";
    if (!f.category) er.category = "Elige una categoría";
    const st = Number(f.stock), th = Number(f.threshold);
    if (f.stock === "" || !Number.isInteger(st) || st < 0) er.stock = "Indica un número entero (0 o más)";
    if (f.threshold === "" || !Number.isInteger(th) || th < 0) er.threshold = "Indica un número entero (0 o más)";
    if (!f.supplier) er.supplier = "Elige un proveedor";
    setErrs(er);
    if (Object.keys(er).length) return;
    onSubmit({ name, category: f.category as Category, stock: st, threshold: th, supplier: f.supplier });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h2 className="text-2xl font-black">Nuevo producto</h2>
      <p className="text-sm text-muted-foreground">Todos los campos son obligatorios.</p>
      <Field label="Nombre" error={errs.name}>
        <input value={f.name} onChange={set("name")} maxLength={80} className={inputCls} placeholder="Ej. Rotulador fluorescente amarillo" />
      </Field>
      <Field label="Categoría" error={errs.category}>
        <select value={f.category} onChange={set("category")} className={inputCls}>
          <option value="">Selecciona…</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock inicial" error={errs.stock}>
          <input type="number" inputMode="numeric" min={0} value={f.stock} onChange={set("stock")} className={inputCls} placeholder="30" />
        </Field>
        <Field label="Umbral de alerta" error={errs.threshold}>
          <input type="number" inputMode="numeric" min={0} value={f.threshold} onChange={set("threshold")} className={inputCls} placeholder="10" />
        </Field>
      </div>
      <Field label="Proveedor" error={errs.supplier}>
        <select value={f.supplier} onChange={set("supplier")} className={inputCls}>
          <option value="">Selecciona…</option>
          {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <button className="w-full rounded-xl bg-secondary py-3.5 font-display text-base font-extrabold text-secondary-foreground">
        Dar de alta
      </button>
    </form>
  );
}

function History({ movements, products }: { movements: Movement[]; products: Product[] }) {
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Producto eliminado";
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black">Historial</h2>
      {movements.length === 0 && (
        <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          Aún no hay movimientos. Registra una entrada o una venta desde la pestaña Stock.
        </p>
      )}
      <ul className="space-y-2">
        {movements.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{name(m.productId)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(m.date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                {m.note && ` · ${m.note}`}
              </p>
            </div>
            <span className={`font-display text-xl font-black ${m.type === "entrada" ? "text-success" : "text-destructive"}`}>
              {m.type === "entrada" ? "+" : "−"}{m.qty}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
