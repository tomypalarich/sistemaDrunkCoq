import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown,
  AlertTriangle, Menu, Package, FileText, Users, Phone,
  MapPin, Calendar, ClipboardList, CheckSquare, Square, Database, Loader2, Tag,
  BarChart3, DollarSign, Wallet, TrendingUp, ChevronRight, Printer, Save
} from "lucide-react";
import {
  subscribeProducts, subscribeProviders, subscribeBudgets, subscribeMovements,
  subscribeStockCategories, subscribeProviderCategories,
  addProduct, updateProduct, deleteProduct, deleteManyProducts,
  addProvider, updateProvider, deleteProvider,
  addBudget, updateBudget, deleteBudget, deleteManyBudgets,
  addStockCategory, addProviderCategory,
  subscribePlanilla, subscribePlanillas, savePlanilla, processStockReturn,
  seedDatabase,
} from "./firestoreApi";
import { TIPOS_EVENTO, ESTADOS } from "./mockData";
import {
  PLANILLA_A_NUMBER_SECTIONS, PLANILLA_A_LINE_SECTION, PLANILLA_A_HEADER_CHECKS,
  PLANILLA_B_TABLE_SECTIONS, PLANILLA_B_NUMBER_SECTIONS, PLANILLA_B_LABELED_SECTIONS,
  PLANILLA_B_STOCK_TABLE_SECTIONS, PLANILLA_B_HEADER_CHECKS,
} from "./planillaTemplates";

/* ----------------------------- HELPERS ----------------------------- */

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function budgetTotal(budget) {
  const base = Number(budget.baseAmount) || 0;
  const extras = (budget.extras || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  return base + extras;
}

// Firestore no numera automáticamente los documentos. Para mostrar "Producto #1",
// "Presupuesto #001", etc. calculamos el número acá mismo, ordenando por fecha
// de creación (createdAt). No se guarda en la base: se recalcula cada vez que
// se muestra la lista, así que si algo se borra, los números se reacomodan solos.
function useSequentialNumbers(list) {
  return useMemo(() => {
    const sorted = [...list].sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return ta - tb;
    });
    const map = {};
    sorted.forEach((item, index) => { map[item.id] = index + 1; });
    return map;
  }, [list]);
}

function relativeTime(createdAt) {
  if (!createdAt?.toDate) return "Justo ahora";
  const diffMin = Math.round((Date.now() - createdAt.toDate().getTime()) / 60000);
  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return diffD === 1 ? "Ayer" : `Hace ${diffD} días`;
}

const statusStyles = {
  Pendiente: "bg-amber-50 text-amber-800 border border-amber-200",
  Aprobado: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  Rechazado: "bg-red-50 text-red-800 border border-red-200",
  Finalizado: "bg-gray-100 text-gray-600 border border-gray-200",
};

const statusDot = {
  Pendiente: "bg-amber-500",
  Aprobado: "bg-emerald-600",
  Rechazado: "bg-red-700",
  Finalizado: "bg-gray-400",
};

const movementTypeLabels = {
  ingreso: { label: "Ingreso", className: "bg-gray-100 text-gray-500" },
  ajuste: { label: "Ajuste", className: "bg-gray-100 text-gray-500" },
  eliminacion: { label: "Eliminado", className: "bg-red-50 text-red-700" },
  volvio: { label: "Volvió", className: "bg-emerald-50 text-emerald-700" },
};

function MovementTypeBadge({ type }) {
  const info = movementTypeLabels[type];
  if (!info) return null;
  return (
    <span className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${info.className}`}>
      {info.label}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
      {status}
    </span>
  );
}

function ProviderChips({ providers, contactProviderId }) {
  if (!providers || providers.length === 0) return <span className="text-gray-400 text-xs">Sin proveedores asignados</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {providers.map((p) => {
        const isContact = p.id === contactProviderId;
        return (
          <span
            key={p.id}
            title={isContact ? "Hizo el contacto con el cliente" : p.name}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isContact ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {isContact && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            {p.name}
          </span>
        );
      })}
    </div>
  );
}

/* ----------------------------- SHARED UI ----------------------------- */

function SpadeMark({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C9 7 3 10.5 3 15a5 5 0 0 0 8.2 3.8c-.3 1.6-1 2.9-2.6 4.2h6.8c-1.6-1.3-2.3-2.6-2.6-4.2A5 5 0 0 0 21 15c0-4.5-6-8-9-13z" />
    </svg>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium mb-1">{eyebrow}</p>
        <h1 className="font-display text-3xl text-zinc-950">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, tone = "default" }) {
  const toneClasses = {
    default: "text-zinc-950",
    alert: "text-red-700",
    success: "text-emerald-700",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex-1 min-w-[140px]">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">{label}</p>
      <p className={`font-display text-2xl ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}

function PrimaryButton({ children, onClick, icon: Icon, full = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
        danger ? "text-red-700 hover:bg-red-50" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-medium text-gray-500 mb-1.5">{children}</label>;
}

const inputClasses =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition-colors";

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-display text-xl text-zinc-950">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-950 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">{footer}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-8 h-8 text-gray-300 mb-3" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition-colors"
      />
    </div>
  );
}

function Select({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition-colors ${className}`}
    >
      {options}
    </select>
  );
}

function CategorySelect({ value, onChange, categories, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    const created = await onCreate(newName.trim());
    setSaving(false);
    setNewName("");
    setAdding(false);
    if (created) onChange(created.name);
  };

  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          className={inputClasses}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nombre de la categoría"
        />
        <button
          onClick={handleCreate}
          disabled={saving}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
        </button>
        <button
          onClick={() => { setAdding(false); setNewName(""); }}
          className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onChange={(v) => (v === "__new__" ? setAdding(true) : onChange(v))}
      className="w-full"
      options={[
        ...categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>),
        <option key="__new__" value="__new__">+ Añadir categoría nueva…</option>,
      ]}
    />
  );
}

/* ----------------------------- STOCK SECTION ----------------------------- */

function ProductForm({ initial, categories, providers, onSubmit, onCancel, onCreateCategory }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || categories[0]?.name || "");
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [minAlert, setMinAlert] = useState(initial?.minAlert ?? 0);
  const [costPrice, setCostPrice] = useState(initial?.costPrice ?? 0);
  const [salePrice, setSalePrice] = useState(initial?.salePrice ?? 0);
  const [providerId, setProviderId] = useState(initial?.providerId || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !category || saving) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(), category, stock: Number(stock) || 0, minAlert: Number(minAlert) || 0,
      costPrice: Number(costPrice) || 0, salePrice: Number(salePrice) || 0, providerId,
    });
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <FieldLabel>Producto</FieldLabel>
          <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mantel blanco redondo" />
        </div>
        <div>
          <FieldLabel>Categoría</FieldLabel>
          <CategorySelect value={category} onChange={setCategory} categories={categories} onCreate={onCreateCategory} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Cantidad en stock</FieldLabel>
            <input type="number" min="0" className={inputClasses} value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Alerta de stock mínimo</FieldLabel>
            <input type="number" min="0" className={inputClasses} value={minAlert} onChange={(e) => setMinAlert(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Precio de costo</FieldLabel>
            <input type="number" min="0" className={inputClasses} value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="$" />
          </div>
          <div>
            <FieldLabel>Precio de venta</FieldLabel>
            <input type="number" min="0" className={inputClasses} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="$" />
          </div>
        </div>
        <div>
          <FieldLabel>Proveedor</FieldLabel>
          {providers.length === 0 ? (
            <p className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg px-3 py-2">
              No hay proveedores cargados todavía. Agregá uno en la sección Proveedores.
            </p>
          ) : (
            <Select
              value={providerId}
              onChange={setProviderId}
              className="w-full"
              options={[
                <option key="none" value="">Sin asignar</option>,
                ...providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>),
              ]}
            />
          )}
        </div>
        {initial?.lastEntryDate && (
          <p className="text-xs text-gray-400">
            Último ingreso registrado: {formatDate(initial.lastEntryDate)} (se actualiza solo al guardar cambios)
          </p>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Añadir producto"}
        </PrimaryButton>
      </div>
    </>
  );
}

function StockSection({ products, categories, providers, movements, loading }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [onlyAlert, setOnlyAlert] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);

  const numbers = useSequentialNumbers(products);
  const providerName = (id) => providers.find((p) => p.id === id)?.name || "Sin asignar";

  const categoryOptions = useMemo(() => ["Todas", ...categories.map((c) => c.name)], [categories]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== "Todas") list = list.filter((p) => p.category === categoryFilter);
    if (onlyAlert) list = list.filter((p) => p.stock <= p.minAlert);
    if (sortBy) {
      list = [...list].sort((a, b) => {
        let res = sortBy === "name" ? a.name.localeCompare(b.name) : a.stock - b.stock;
        return sortDir === "asc" ? res : -res;
      });
    }
    return list;
  }, [products, search, categoryFilter, onlyAlert, sortBy, sortDir]);

  const alertCount = products.filter((p) => p.stock <= p.minAlert).length;

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("asc"); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const handleSave = async (data) => {
    if (modal.mode === "edit") await updateProduct(modal.product.id, data);
    else await addProduct(data);
    setModal(null);
  };

  const handleDeleteOne = async (product) => {
    await deleteProduct(product);
    setSelected((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
  };

  const handleDeleteSelected = async () => {
    await deleteManyProducts(products.filter((p) => selected.has(p.id)));
    setSelected(new Set());
  };

  const SortIcon = ({ active }) =>
    !active ? null : sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />;

  return (
    <div>
      <SectionHeader
        eyebrow="Sección 01 · ♠"
        title="Control de mercadería"
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "new" })}>Nuevo producto</PrimaryButton>}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Productos totales" value={products.length} />
        <StatCard label="En alerta de stock" value={alertCount} tone={alertCount > 0 ? "alert" : "default"} />
        <StatCard label="Categorías activas" value={categories.length} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto por nombre…" />
          <Select value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)} />
          <button
            onClick={() => setOnlyAlert((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              onlyAlert ? "bg-red-700 text-white border-red-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Solo en alerta
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400 self-center mr-1">Ordenar:</span>
          <button
            onClick={() => toggleSort("name")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              sortBy === "name" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Alfabéticamente
            {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
          </button>
          <button
            onClick={() => toggleSort("stock")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              sortBy === "stock" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Por cantidad de stock
            {sortBy === "stock" && (sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
          </button>
          {sortBy && (
            <button onClick={() => setSortBy(null)} className="text-xs text-gray-400 hover:text-zinc-950 px-2 py-1.5">
              Quitar orden
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between bg-zinc-950 text-white rounded-lg px-4 py-2.5 mb-4 text-sm">
            <span>{selected.size} producto(s) seleccionado(s)</span>
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1.5 text-red-300 hover:text-red-200 font-medium">
              <Trash2 className="w-4 h-4" /> Eliminar varios
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} message="No hay productos que coincidan con la búsqueda o los filtros aplicados." />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                    <th className="py-3 pr-3 w-8">
                      <button onClick={toggleSelectAll}>
                        {selected.size === filtered.length ? <CheckSquare className="w-4 h-4 text-zinc-950" /> : <Square className="w-4 h-4 text-gray-300" />}
                      </button>
                    </th>
                    <th className="py-3 pr-3">N°</th>
                    <th className="py-3 pr-3 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                      Producto <SortIcon active={sortBy === "name"} />
                    </th>
                    <th className="py-3 pr-3">Categoría</th>
                    <th className="py-3 pr-3 cursor-pointer select-none" onClick={() => toggleSort("stock")}>
                      Stock <SortIcon active={sortBy === "stock"} />
                    </th>
                    <th className="py-3 pr-3">Alerta mínima</th>
                    <th className="py-3 pr-3">Costo</th>
                    <th className="py-3 pr-3">Venta</th>
                    <th className="py-3 pr-3">Valor total</th>
                    <th className="py-3 pr-3">Últ. ingreso</th>
                    <th className="py-3 pr-3">Proveedor</th>
                    <th className="py-3 pr-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const inAlert = p.stock <= p.minAlert;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 pr-3">
                          <button onClick={() => toggleSelect(p.id)}>
                            {selected.has(p.id) ? <CheckSquare className="w-4 h-4 text-zinc-950" /> : <Square className="w-4 h-4 text-gray-300" />}
                          </button>
                        </td>
                        <td className="py-3 pr-3 text-gray-400 text-xs">#{numbers[p.id] || "—"}</td>
                        <td className="py-3 pr-3 font-medium text-zinc-950">{p.name}</td>
                        <td className="py-3 pr-3 text-gray-500">{p.category}</td>
                        <td className={`py-3 pr-3 font-medium ${inAlert ? "text-red-700" : "text-zinc-950"}`}>{p.stock}</td>
                        <td className="py-3 pr-3">
                          {inAlert ? (
                            <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> Mín. {p.minAlert}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Mín. {p.minAlert}</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-gray-500">{formatMoney(p.costPrice)}</td>
                        <td className="py-3 pr-3 text-emerald-700 font-medium">{formatMoney(p.salePrice)}</td>
                        <td className="py-3 pr-3 font-medium text-zinc-950">{formatMoney((Number(p.costPrice) || 0) * (Number(p.stock) || 0))}</td>
                        <td className="py-3 pr-3 text-gray-400 text-xs">{p.lastEntryDate ? formatDate(p.lastEntryDate) : "—"}</td>
                        <td className="py-3 pr-3 text-gray-500">{providerName(p.providerId)}</td>
                        <td className="py-3 pr-3">
                          <div className="flex justify-end gap-1">
                            <GhostButton icon={Pencil} onClick={() => setModal({ mode: "edit", product: p })} />
                            <GhostButton icon={Trash2} danger onClick={() => handleDeleteOne(p)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered.map((p) => {
                const inAlert = p.stock <= p.minAlert;
                return (
                  <div key={p.id} className={`border rounded-xl p-4 ${inAlert ? "border-red-200 bg-red-50/40" : "border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => toggleSelect(p.id)} className="mt-0.5">
                        {selected.has(p.id) ? <CheckSquare className="w-4 h-4 text-zinc-950" /> : <Square className="w-4 h-4 text-gray-300" />}
                      </button>
                      <div className="flex-1">
                        <p className="font-medium text-zinc-950 text-sm">#{numbers[p.id] || "—"} · {p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.category} · {providerName(p.providerId)}</p>
                      </div>
                      <div className="flex gap-1">
                        <GhostButton icon={Pencil} onClick={() => setModal({ mode: "edit", product: p })} />
                        <GhostButton icon={Trash2} danger onClick={() => handleDeleteOne(p)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className={`text-sm font-medium ${inAlert ? "text-red-700" : "text-zinc-950"}`}>Stock: {p.stock}</span>
                      {inAlert ? (
                        <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Mín. {p.minAlert}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Mín. {p.minAlert}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-gray-400">Costo: {formatMoney(p.costPrice)}</span>
                      <span className="text-emerald-700 font-medium">Venta: {formatMoney(p.salePrice)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-zinc-950 font-medium">Valor total: {formatMoney((Number(p.costPrice) || 0) * (Number(p.stock) || 0))}</span>
                      <span className="text-gray-400">{p.lastEntryDate ? formatDate(p.lastEntryDate) : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-zinc-950">Historial de movimientos</h3>
        </div>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-400">Todavía no hay movimientos registrados.</p>
        ) : (
          <ul className="space-y-3">
            {movements.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <MovementTypeBadge type={m.type} />
                  {m.text}
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap shrink-0">{relativeTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "edit" ? "Editar producto" : "Nuevo producto"} onClose={() => setModal(null)}>
          <ProductForm
            initial={modal.product}
            categories={categories}
            providers={providers}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
            onCreateCategory={(name) => addStockCategory(name, categories)}
          />
        </Modal>
      )}
    </div>
  );
}

function ProviderSearchPicker({ providers, selectedIds, onToggle }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = providers.filter((p) => selectedIds.includes(p.id));

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return providers
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) : true))
      .slice(0, 6);
  }, [providers, selectedIds, query]);

  const handlePick = (id) => {
    onToggle(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-zinc-950 text-white">
              {p.name}
              <button onClick={() => onToggle(p.id)} className="hover:bg-white/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar proveedor por nombre o categoría…"
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition-colors"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-gray-400">
              {providers.length === 0 ? "No hay proveedores cargados todavía." : "No se encontraron proveedores para esa búsqueda."}
            </p>
          ) : (
            suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePick(p.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <span className="text-zinc-950">{p.name}</span>
                <span className="text-gray-400 text-xs shrink-0">{p.category}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- ADMIN SECTION (PRESUPUESTOS) ----------------------------- */

function ExtrasEditor({ extras, onChange }) {
  const addExtra = () => onChange([...extras, { name: "", price: "" }]);
  const updateExtra = (index, field, value) => {
    const next = extras.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    onChange(next);
  };
  const removeExtra = (index) => onChange(extras.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {extras.map((extra, index) => (
        <div key={index} className="flex gap-2">
          <input
            className={inputClasses}
            value={extra.name}
            onChange={(e) => updateExtra(index, "name", e.target.value)}
            placeholder="Ej: Máquina Jägermeister"
          />
          <input
            type="number"
            min="0"
            className={`${inputClasses} w-32`}
            value={extra.price}
            onChange={(e) => updateExtra(index, "price", e.target.value)}
            placeholder="$"
          />
          <button onClick={() => removeExtra(index)} className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addExtra}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-zinc-950 px-2 py-1.5 rounded-lg hover:bg-gray-100"
      >
        <Plus className="w-3.5 h-3.5" /> Añadir más
      </button>
    </div>
  );
}

function BudgetForm({ initial, providers, onSubmit, onCancel }) {
  const [eventType, setEventType] = useState(initial?.eventType || TIPOS_EVENTO[0]);
  const [guests, setGuests] = useState(initial?.guests ?? "");
  const [venue, setVenue] = useState(initial?.venue || "");
  const [locality, setLocality] = useState(initial?.locality || "");
  const [date, setDate] = useState(initial?.date || "");
  const [contact, setContact] = useState(initial?.contact || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [providerIds, setProviderIds] = useState(initial?.providerIds || []);
  const [contactProviderId, setContactProviderId] = useState(initial?.contactProviderId || "");
  const [status, setStatus] = useState(initial?.status || "Pendiente");
  const [barType, setBarType] = useState(initial?.barType || "");
  const [baseAmount, setBaseAmount] = useState(initial?.baseAmount ?? 0);
  const [extras, setExtras] = useState(initial?.extras || []);
  const [saving, setSaving] = useState(false);

  const toggleProvider = (id) => {
    setProviderIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(contactProviderId)) setContactProviderId("");
      return next;
    });
  };

  const extrasTotal = extras.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  const total = (Number(baseAmount) || 0) + extrasTotal;

  const valid = venue.trim() && locality.trim() && date && contact.trim() && phone.trim();

  const handleSubmit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    await onSubmit({
      eventType, guests: Number(guests) || 0, venue: venue.trim(), locality: locality.trim(),
      date, contact: contact.trim(), phone: phone.trim(), providerIds, contactProviderId, status,
      barType: barType.trim(),
      baseAmount: Number(baseAmount) || 0,
      extras: extras.filter((e) => e.name.trim()).map((e) => ({ name: e.name.trim(), price: Number(e.price) || 0 })),
    });
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Tipo de evento</FieldLabel>
            <Select value={eventType} onChange={setEventType} className="w-full" options={TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)} />
          </div>
          <div>
            <FieldLabel>Cantidad de invitados</FieldLabel>
            <input type="number" min="0" className={inputClasses} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Ej: 120" />
          </div>
        </div>
        <div>
          <FieldLabel>Ubicación / Salón</FieldLabel>
          <input className={inputClasses} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ej: Salón Las Acacias" />
        </div>
        <div>
          <FieldLabel>Localidad</FieldLabel>
          <input className={inputClasses} value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Ej: Córdoba Capital" />
        </div>
        <div>
          <FieldLabel>Fecha del evento</FieldLabel>
          <input type="date" className={inputClasses} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Contacto</FieldLabel>
            <input className={inputClasses} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nombre y apellido" />
          </div>
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <input className={inputClasses} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 351 555 0142" />
          </div>
        </div>
        <div>
          <FieldLabel>Tipo de barra</FieldLabel>
          <input className={inputClasses} value={barType} onChange={(e) => setBarType(e.target.value)} placeholder="Ej: Barra libre premium" />
        </div>
        <div>
          <FieldLabel>Monto base del presupuesto</FieldLabel>
          <input type="number" min="0" className={inputClasses} value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} placeholder="$" />
        </div>
        <div>
          <FieldLabel>Adicionales</FieldLabel>
          <ExtrasEditor extras={extras} onChange={setExtras} />
        </div>
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
          <span className="text-xs text-gray-500">Total del presupuesto</span>
          <span className="font-display text-lg text-zinc-950">{formatMoney(total)}</span>
        </div>
        <div>
          <FieldLabel>Proveedores asignados</FieldLabel>
          <ProviderSearchPicker providers={providers} selectedIds={providerIds} onToggle={toggleProvider} />
          {providers.length === 0 && (
            <p className="text-xs text-gray-400 mt-1.5">No hay proveedores cargados todavía. Agregá uno en la sección Proveedores.</p>
          )}
        </div>
        {providerIds.length > 0 && (
          <div>
            <FieldLabel>¿Quién hizo el contacto con el cliente?</FieldLabel>
            <Select
              value={contactProviderId}
              onChange={setContactProviderId}
              className="w-full"
              options={[
                <option key="none" value="">Sin marcar</option>,
                ...providers.filter((p) => providerIds.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>),
              ]}
            />
          </div>
        )}
        <div>
          <FieldLabel>Estado del presupuesto</FieldLabel>
          <Select value={status} onChange={setStatus} className="w-full" options={ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear presupuesto"}
        </PrimaryButton>
      </div>
    </>
  );
}

function AdminSection({ budgets, providers, loading }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);

  const numbers = useSequentialNumbers(budgets);
  const getProviders = (b) => (b.providerIds || []).map((id) => providers.find((p) => p.id === id)).filter(Boolean);

  const filtered = useMemo(() => {
    let list = budgets.filter(
      (b) =>
        b.venue.toLowerCase().includes(search.toLowerCase()) ||
        b.contact.toLowerCase().includes(search.toLowerCase()) ||
        b.eventType.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "Todos") list = list.filter((b) => b.status === statusFilter);
    return [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [budgets, search, statusFilter]);

  const toggleSelect = (id) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((b) => b.id)));
  };

  const handleSave = async (data) => {
    if (modal.mode === "edit") await updateBudget(modal.budget.id, data);
    else await addBudget(data);
    setModal(null);
  };

  const handleDeleteOne = async (b) => {
    await deleteBudget(b.id);
    setSelected((prev) => { const n = new Set(prev); n.delete(b.id); return n; });
  };

  const handleDeleteSelected = async () => {
    await deleteManyBudgets([...selected]);
    setSelected(new Set());
  };

  const counts = ESTADOS.reduce((acc, s) => ({ ...acc, [s]: budgets.filter((b) => b.status === s).length }), {});
  const budgetLabel = (b) => `Presupuesto #${String(numbers[b.id] || 0).padStart(3, "0")}`;

  return (
    <div>
      <SectionHeader
        eyebrow="Administración · Sección 02 · ♠"
        title="Gestión de presupuestos"
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "new" })}>Nuevo presupuesto</PrimaryButton>}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Pendientes" value={counts.Pendiente} />
        <StatCard label="Aprobados" value={counts.Aprobado} tone="success" />
        <StatCard label="Rechazados" value={counts.Rechazado} tone="alert" />
        <StatCard label="Finalizados" value={counts.Finalizado} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por evento, salón o contacto…" />
          <Select value={statusFilter} onChange={setStatusFilter} options={["Todos", ...ESTADOS].map((s) => <option key={s} value={s}>{s}</option>)} />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between bg-zinc-950 text-white rounded-lg px-4 py-2.5 mb-4 text-sm">
            <span>{selected.size} presupuesto(s) seleccionado(s)</span>
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1.5 text-red-300 hover:text-red-200 font-medium">
              <Trash2 className="w-4 h-4" /> Eliminar varios
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} message="No se encontraron presupuestos con esos criterios." />
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                    <th className="py-3 pr-3 w-8">
                      <button onClick={toggleSelectAll}>
                        {selected.size === filtered.length ? <CheckSquare className="w-4 h-4 text-zinc-950" /> : <Square className="w-4 h-4 text-gray-300" />}
                      </button>
                    </th>
                    <th className="py-3 pr-3">N°</th>
                    <th className="py-3 pr-3">Evento</th>
                    <th className="py-3 pr-3">Invitados</th>
                    <th className="py-3 pr-3">Salón / Localidad</th>
                    <th className="py-3 pr-3">Fecha</th>
                    <th className="py-3 pr-3">Contacto</th>
                    <th className="py-3 pr-3">Barra / Adicionales</th>
                    <th className="py-3 pr-3">Proveedor</th>
                    <th className="py-3 pr-3">Total</th>
                    <th className="py-3 pr-3">Estado</th>
                    <th className="py-3 pr-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors align-top">
                      <td className="py-3 pr-3">
                        <button onClick={() => toggleSelect(b.id)}>
                          {selected.has(b.id) ? <CheckSquare className="w-4 h-4 text-zinc-950" /> : <Square className="w-4 h-4 text-gray-300" />}
                        </button>
                      </td>
                      <td className="py-3 pr-3 text-gray-400 text-xs">#{String(numbers[b.id] || 0).padStart(3, "0")}</td>
                      <td className="py-3 pr-3 font-medium text-zinc-950">{b.eventType}</td>
                      <td className="py-3 pr-3 text-gray-600">{b.guests}</td>
                      <td className="py-3 pr-3 text-gray-600">
                        <div>{b.venue}</div>
                        <div className="text-xs text-gray-400">{b.locality}</div>
                      </td>
                      <td className="py-3 pr-3 text-gray-600">{formatDate(b.date)}</td>
                      <td className="py-3 pr-3 text-gray-600">
                        <div>{b.contact}</div>
                        <div className="text-xs text-gray-400">{b.phone}</div>
                      </td>
                      <td className="py-3 pr-3 text-gray-600">
                        <div>{b.barType || "—"}</div>
                        {(b.extras || []).length > 0 && (
                          <div className="text-xs text-gray-400">{b.extras.map((e) => e.name).join(", ")}</div>
                        )}
                      </td>
                      <td className="py-3 pr-3"><ProviderChips providers={getProviders(b)} contactProviderId={b.contactProviderId} /></td>
                      <td className="py-3 pr-3 font-medium text-zinc-950">{formatMoney(budgetTotal(b))}</td>
                      <td className="py-3 pr-3"><StatusBadge status={b.status} /></td>
                      <td className="py-3 pr-3">
                        <div className="flex justify-end gap-1">
                          <GhostButton icon={Pencil} onClick={() => setModal({ mode: "edit", budget: b })} />
                          <GhostButton icon={Trash2} danger onClick={() => handleDeleteOne(b)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {filtered.map((b) => (
                <div key={b.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <button onClick={() => toggleSelect(b.id)} className="mt-0.5">
                      {selected.has(b.id) ? <CheckSquare className="w-4 h-4 text-zinc-950" /> : <Square className="w-4 h-4 text-gray-300" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">{budgetLabel(b)}</p>
                      <p className="font-medium text-zinc-950 text-sm">{b.eventType}</p>
                      <p className="text-xs text-gray-400">{b.guests} invitados</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 pl-7">
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />{b.venue}, {b.locality}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{formatDate(b.date)}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{b.contact} · {b.phone}</p>
                    {b.barType && <p className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-gray-400" />{b.barType}</p>}
                    <p className="flex items-start gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400 mt-0.5" /><ProviderChips providers={getProviders(b)} contactProviderId={b.contactProviderId} /></p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 pl-7">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="font-medium text-zinc-950 text-sm">{formatMoney(budgetTotal(b))}</span>
                  </div>
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                    <GhostButton icon={Pencil} onClick={() => setModal({ mode: "edit", budget: b })}>Editar</GhostButton>
                    <GhostButton icon={Trash2} danger onClick={() => handleDeleteOne(b)}>Eliminar</GhostButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "edit" ? `Editar ${budgetLabel(modal.budget)}` : "Nuevo presupuesto"} onClose={() => setModal(null)}>
          <BudgetForm initial={modal.budget} providers={providers} onSubmit={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- CENTRO DE COSTOS ----------------------------- */

function ComparisonBars({ label1, value1, label2, value2 }) {
  const max = Math.max(value1, value2, 1);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-500">{label1}</span>
          <span className="font-medium text-zinc-950">{formatMoney(value1)}</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-red-700 rounded-full transition-all" style={{ width: `${(value1 / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-500">{label2}</span>
          <span className="font-medium text-zinc-950">{formatMoney(value2)}</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${(value2 / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function CostCenterSection({ products, budgets, planillas, categories, loading }) {
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [scope, setScope] = useState("anio"); // 'anio' | 'mes' | 'evento'
  const [selectedBudgetId, setSelectedBudgetId] = useState("");

  const numbers = useSequentialNumbers(budgets);
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const counts = ESTADOS.reduce((acc, s) => ({ ...acc, [s]: budgets.filter((b) => b.status === s).length }), {});

  const stockForCategory = categoryFilter === "Todas" ? products : products.filter((p) => p.category === categoryFilter);
  const stockValueCost = stockForCategory.reduce((sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stock) || 0), 0);
  const stockValueSale = stockForCategory.reduce((sum, p) => sum + (Number(p.salePrice) || 0) * (Number(p.stock) || 0), 0);

  // Presupuestos dentro del rango elegido (año actual / mes actual / un evento puntual)
  const scopedBudgets = useMemo(() => {
    if (scope === "evento") return budgets.filter((b) => b.id === selectedBudgetId);
    if (scope === "mes") return budgets.filter((b) => (b.date || "").startsWith(currentMonth));
    return budgets.filter((b) => (b.date || "").startsWith(currentYear));
  }, [budgets, scope, selectedBudgetId, currentMonth, currentYear]);

  const approvedScoped = scopedBudgets.filter((b) => b.status === "Aprobado");
  const facturacionTotal = approvedScoped.reduce((sum, b) => sum + budgetTotal(b), 0);

  // Mermas/faltantes: suma de los retornos ya procesados (planillas con .retorno)
  // que pertenecen a alguno de los presupuestos dentro del rango elegido.
  const scopedBudgetIds = new Set(scopedBudgets.map((b) => b.id));
  const mermasTotal = planillas
    .filter((p) => p.retorno && scopedBudgetIds.has(p.retorno.budgetId))
    .reduce((sum, p) => sum + (Number(p.retorno.totalCost) || 0), 0);

  const balance = facturacionTotal - mermasTotal;
  const scopeLabel = scope === "evento" ? "del evento seleccionado" : scope === "mes" ? "de este mes" : "de este año";

  return (
    <div>
      <SectionHeader eyebrow="Administración · Sección 02 · ♠" title="Centro de costos" />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Análisis de presupuestos */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-zinc-950">Análisis de presupuestos</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatCard label="Pendientes" value={counts.Pendiente} />
              <StatCard label="Aprobados" value={counts.Aprobado} tone="success" />
              <StatCard label="Rechazados" value={counts.Rechazado} tone="alert" />
              <StatCard label="Finalizados" value={counts.Finalizado} />
            </div>
          </div>

          {/* Análisis de stock */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-zinc-950">Análisis de stock</h3>
              </div>
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={["Todas", ...categories.map((c) => c.name)].map((c) => <option key={c} value={c}>{c}</option>)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <StatCard label="Valor del inventario (costo)" value={formatMoney(stockValueCost)} />
              <StatCard label="Valor del inventario (venta)" value={formatMoney(stockValueSale)} tone="success" />
              <StatCard label="Productos" value={stockForCategory.length} />
            </div>
          </div>

          {/* Análisis financiero */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-zinc-950">Análisis financiero y de mermas</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setScope("anio")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${scope === "anio" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  Este año
                </button>
                <button
                  onClick={() => setScope("mes")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${scope === "mes" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  Este mes
                </button>
                <button
                  onClick={() => setScope("evento")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${scope === "evento" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  Por evento
                </button>
              </div>
            </div>

            {scope === "evento" && (
              <div className="mb-5">
                <Select
                  value={selectedBudgetId}
                  onChange={setSelectedBudgetId}
                  className="w-full sm:w-auto"
                  options={[
                    <option key="" value="">Seleccionar presupuesto…</option>,
                    ...budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{String(numbers[b.id] || 0).padStart(3, "0")} · {b.eventType} · {b.venue}
                      </option>
                    )),
                  ]}
                />
              </div>
            )}

            <p className="text-xs text-gray-400 mb-5">
              Facturación de presupuestos aprobados y mermas/faltantes (según los retornos ya procesados en Planillas) {scopeLabel}.
            </p>
            <ComparisonBars
              label1="Mermas / faltantes"
              value1={mermasTotal}
              label2="Facturación total (aprobados)"
              value2={facturacionTotal}
            />
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Balance estimado
              </span>
              <span className={`font-display text-xl ${balance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {formatMoney(balance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- PROVEEDORES SECTION ----------------------------- */

function ProviderForm({ initial, categories, onSubmit, onCancel, onCreateCategory }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || categories[0]?.name || "");
  const [locality, setLocality] = useState(initial?.locality || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !locality.trim() || !category || saving) return;
    setSaving(true);
    await onSubmit({ name: name.trim(), category, locality: locality.trim() });
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <FieldLabel>Nombre del proveedor</FieldLabel>
          <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sabores del Sur" />
        </div>
        <div>
          <FieldLabel>Categoría</FieldLabel>
          <CategorySelect value={category} onChange={setCategory} categories={categories} onCreate={onCreateCategory} />
        </div>
        <div>
          <FieldLabel>Localidad</FieldLabel>
          <input className={inputClasses} value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Ej: Córdoba Capital" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Añadir proveedor"}
        </PrimaryButton>
      </div>
    </>
  );
}

function ProvidersSection({ providers, categories, loading }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [sortBy, setSortBy] = useState("name"); // 'name' | 'category'
  const [modal, setModal] = useState(null);

  const categoryOptions = useMemo(() => ["Todas", ...categories.map((c) => c.name)], [categories]);

  const filtered = useMemo(() => {
    let list = providers.filter(
      (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    );
    if (categoryFilter !== "Todas") list = list.filter((p) => p.category === categoryFilter);
    list = [...list].sort((a, b) =>
      sortBy === "category" ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)
    );
    return list;
  }, [providers, search, categoryFilter, sortBy]);

  const handleSave = async (data) => {
    if (modal.mode === "edit") await updateProvider(modal.provider.id, data);
    else await addProvider(data);
    setModal(null);
  };

  const handleDelete = async (p) => deleteProvider(p.id);

  return (
    <div>
      <SectionHeader
        eyebrow="Sección 03 · ♠"
        title="Proveedores"
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "new" })}>Nuevo proveedor</PrimaryButton>}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Proveedores activos" value={providers.length} />
        <StatCard label="Categorías cubiertas" value={categories.length} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o categoría…" />
          <Select value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400 self-center mr-1">Ordenar:</span>
          <button
            onClick={() => setSortBy("name")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              sortBy === "name" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Alfabéticamente
          </button>
          <button
            onClick={() => setSortBy("category")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              sortBy === "category" ? "bg-zinc-950 text-white border-zinc-950" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Por categoría
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} message="No hay proveedores que coincidan con la búsqueda o los filtros aplicados." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-950 text-sm">{p.name}</p>
                    <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.category}</span>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                  <MapPin className="w-3.5 h-3.5" /> {p.locality}
                </p>
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                  <GhostButton icon={Pencil} onClick={() => setModal({ mode: "edit", provider: p })}>Editar</GhostButton>
                  <GhostButton icon={Trash2} danger onClick={() => handleDelete(p)}>Eliminar</GhostButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "edit" ? "Editar proveedor" : "Nuevo proveedor"} onClose={() => setModal(null)}>
          <ProviderForm
            initial={modal.provider}
            categories={categories}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
            onCreateCategory={(name) => addProviderCategory(name, categories)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- NAVIGATION ----------------------------- */

/* ----------------------------- PLANILLAS ----------------------------- */

// Convierte texto libre en algo apto para nombre de archivo:
// sin acentos, sin espacios raros, sin caracteres especiales.
function slugify(text) {
  return (text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // saca acentos
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function printPlanilla({ tipo, budget }) {
  const filename = `Planilla_${tipo}_${slugify(budget?.eventType)}_${slugify(budget?.date)}`;
  const prevTitle = document.title;
  document.title = filename;
  const restore = () => { document.title = prevTitle; window.removeEventListener("afterprint", restore); };
  window.addEventListener("afterprint", restore);
  window.print();
  // Por si el navegador no dispara "afterprint" (pasa en algunos casos), restauramos igual después de un rato.
  setTimeout(restore, 2000);
}

function CheckBox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-zinc-950 focus:ring-zinc-950/20"
      />
      <span className="text-gray-600">{label}</span>
    </label>
  );
}

function PlanillaHeader({ budget, checks, headerChecks, onChangeCheck }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Fecha</p>
          <p className="text-sm font-medium text-zinc-950">{formatDate(budget.date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Tipo de evento</p>
          <p className="text-sm font-medium text-zinc-950">{budget.eventType}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Localidad</p>
          <p className="text-sm font-medium text-zinc-950">{budget.locality}</p>
        </div>
      </div>
      <div className="flex gap-4">
        {headerChecks.map((c) => (
          <CheckBox key={c.key} label={c.label} checked={checks[c.key]} onChange={(v) => onChangeCheck(c.key, v)} />
        ))}
      </div>
    </div>
  );
}

function PlanillaNumberGrid({ title, items, values, onChangeItem }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-zinc-950 mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 border border-gray-200 rounded-xl p-4 print:border-0 print:p-0">
        {items.map((item) => (
          <label key={item} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-600">{item}</span>
            <input
              type="number"
              min="0"
              value={values[item] ?? ""}
              onChange={(e) => onChangeItem(item, e.target.value)}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-zinc-950/10 print:border-0 print:border-b print:rounded-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

// Sección de ítems con "marca" fija (impresa, no editable) + una cantidad
// editable. Como el nombre+marca se puede repetir, cada ítem se identifica
// por su posición en la lista (índice), no por el texto.
function PlanillaLabeledGrid({ title, items, values, onChangeItem }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-zinc-950 mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 border border-gray-200 rounded-xl p-4 print:border-0 print:p-0">
        {items.map((item, index) => (
          <label key={index} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-600">
              {item.label} <span className="text-gray-400">· {item.marca}</span>
            </span>
            <input
              type="number"
              min="0"
              value={values[index] ?? ""}
              onChange={(e) => onChangeItem(index, e.target.value)}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-zinc-950/10 print:border-0 print:border-b print:rounded-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

// Renglones en blanco para completar a mano (así es en el documento
// original: cada palabra con una línea de puntos al lado).
function PlanillaLineItems({ title, items, values, onChangeItem }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-zinc-950 mb-2">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border border-gray-200 rounded-xl p-4 print:border-0 print:p-0">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 w-40 shrink-0">{item}</span>
            <input
              value={values[item] || ""}
              onChange={(e) => onChangeItem(item, e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10 print:border-0 print:border-b print:rounded-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanillaTable({ title, columns, items, values, onChangeCell, showIndex = true }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-zinc-950 mb-2">{title}</h4>
      <div className="overflow-x-auto border border-gray-200 rounded-xl print:border-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400 uppercase tracking-wide border-b border-gray-100">
              {showIndex && <th className="py-2 px-2 w-8">N°</th>}
              <th className="py-2 px-2">Producto</th>
              {columns.map((col) => (
                <th key={col.key} className="py-2 px-2">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const row = values[item] || {};
              return (
                <tr key={item} className="border-b border-gray-50">
                  {showIndex && <td className="py-1.5 px-2 text-gray-400">{index + 1}</td>}
                  <td className="py-1.5 px-2 font-medium text-zinc-950">{item}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-1.5 px-2">
                      <input
                        value={row[col.key] || ""}
                        onChange={(e) => onChangeCell(item, col.key, e.target.value)}
                        className="w-full rounded border border-gray-300 px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10 print:border-0 print:border-b print:rounded-none"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductSearchInline({ products, value, onPick }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [products, query]);

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={open ? query : value?.name || ""}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        placeholder="Buscar producto de Stock…"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">No se encontraron productos.</p>
          ) : (
            suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => { onPick(p); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <span className="text-zinc-950">{p.name}</span>
                <span className="text-gray-400 shrink-0">Stock: {p.stock}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ReturnEditor({ budget, products, planilla, planillaId, planillaType, onProcessed }) {
  const alreadyProcessed = planilla?.retorno;
  const [rows, setRows] = useState([{ productId: "", productName: "", costPrice: 0, salida: "", vuelta: "" }]);
  const [processing, setProcessing] = useState(false);

  const addRow = () => setRows((prev) => [...prev, { productId: "", productName: "", costPrice: 0, salida: "", vuelta: "" }]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));
  const updateRow = (index, patch) => setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const rowsWithConsumed = rows.map((r) => ({
    ...r,
    consumed: Math.max(0, (Number(r.salida) || 0) - (Number(r.vuelta) || 0)),
  }));
  const totalCost = rowsWithConsumed.reduce((sum, r) => sum + r.consumed * (Number(r.costPrice) || 0), 0);
  const validRows = rowsWithConsumed.filter((r) => r.productId);

  const handleProcess = async () => {
    if (validRows.length === 0 || processing) return;
    setProcessing(true);
    await processStockReturn({
      planillaId,
      budgetId: budget.id,
      budgetLabel: budget.eventType,
      planillaType,
      items: validRows,
    });
    setProcessing(false);
    if (onProcessed) onProcessed();
  };

  if (alreadyProcessed) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <h3 className="text-sm font-medium text-zinc-950">Retorno ya procesado</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          El stock ya fue actualizado para este evento. Si necesitás corregirlo, hacelo manualmente desde la sección Stock.
        </p>
        <div className="space-y-2">
          {(alreadyProcessed.items || []).filter((i) => i.productId).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
              <span className="text-gray-700">{item.productName}</span>
              <span className="text-gray-500">Consumido: {item.consumed} · {formatMoney(item.consumed * (Number(item.costPrice) || 0))}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">Costo total de mermas/consumo</span>
          <span className="font-display text-lg text-zinc-950">{formatMoney(alreadyProcessed.totalCost)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-zinc-950 mb-1">Registrar retorno del evento</h3>
      <p className="text-xs text-gray-400 mb-4">
        Elegí de tu Stock cada producto que salió para este evento, cuánto se llevó y cuánto volvió. La diferencia se descuenta del Stock y queda registrada como "Volvió" en el historial.
      </p>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const consumed = Math.max(0, (Number(row.salida) || 0) - (Number(row.vuelta) || 0));
          return (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-5">
                <ProductSearchInline
                  products={products}
                  value={row.productId ? { name: row.productName } : null}
                  onPick={(p) => updateRow(index, { productId: p.id, productName: p.name, costPrice: p.costPrice || 0 })}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <input
                  type="number" min="0" placeholder="Salió"
                  value={row.salida}
                  onChange={(e) => updateRow(index, { salida: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <input
                  type="number" min="0" placeholder="Volvió"
                  value={row.vuelta}
                  onChange={(e) => updateRow(index, { vuelta: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>
              <div className="col-span-4 sm:col-span-2 text-xs text-gray-500 text-right">
                Consumido: <span className="text-zinc-950 font-medium">{consumed}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button onClick={() => removeRow(index)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-zinc-950 px-2 py-1.5 rounded-lg hover:bg-gray-100 mt-3"
      >
        <Plus className="w-3.5 h-3.5" /> Agregar producto
      </button>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">Costo total estimado de mermas/consumo</span>
        <span className="font-display text-lg text-zinc-950">{formatMoney(totalCost)}</span>
      </div>

      <div className="flex justify-end mt-4">
        <PrimaryButton onClick={handleProcess} disabled={processing || validRows.length === 0}>
          {processing ? "Procesando…" : "Procesar retorno y actualizar Stock"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function PlanillaSaveBar({ onSave, saving, onPrint }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
      <p className="text-xs text-gray-400">Los cambios no se guardan solos: usá "Guardar" antes de imprimir si hiciste modificaciones.</p>
      <div className="flex gap-2">
        <GhostButton icon={Save} onClick={onSave}>{saving ? "Guardando…" : "Guardar"}</GhostButton>
        <PrimaryButton icon={Printer} onClick={onPrint}>Imprimir / Guardar PDF</PrimaryButton>
      </div>
    </div>
  );
}

function PlanillaA({ budget, planilla, onSave }) {
  const [values, setValues] = useState(() => planilla || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValues(planilla || {}); }, [planilla]);

  const updateSection = (sectionKey, item, value) => {
    setValues((prev) => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), [item]: value } }));
  };
  const updateCheck = (key, value) => {
    setValues((prev) => ({ ...prev, headerChecks: { ...(prev.headerChecks || {}), [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  };

  return (
    <div>
      <PlanillaSaveBar onSave={handleSave} saving={saving} onPrint={() => printPlanilla({ tipo: "A", budget })} />

      <div id="printable-planilla" className="print-area bg-white border border-gray-200 rounded-2xl p-5 print:border-0 print:p-0">
        <h3 className="font-display text-xl text-zinc-950 mb-1">DrunkCoq / Logística — Planilla A</h3>
        <p className="text-xs text-gray-400 mb-4">Herramientas y logística general</p>
        <PlanillaHeader
          budget={budget}
          checks={values.headerChecks || {}}
          headerChecks={PLANILLA_A_HEADER_CHECKS}
          onChangeCheck={updateCheck}
        />

        {PLANILLA_A_NUMBER_SECTIONS.map((section) => (
          <PlanillaNumberGrid
            key={section.key}
            title={section.title}
            items={section.items}
            values={values[section.key] || {}}
            onChangeItem={(item, v) => updateSection(section.key, item, v)}
          />
        ))}

        <PlanillaLineItems
          title={PLANILLA_A_LINE_SECTION.title}
          items={PLANILLA_A_LINE_SECTION.items}
          values={values[PLANILLA_A_LINE_SECTION.key] || {}}
          onChangeItem={(item, v) => updateSection(PLANILLA_A_LINE_SECTION.key, item, v)}
        />
      </div>
    </div>
  );
}

function PlanillaB({ budget, planilla, onSave }) {
  const [values, setValues] = useState(() => planilla || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValues(planilla || {}); }, [planilla]);

  const updateCell = (sectionKey, item, colKey, value) => {
    setValues((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [item]: { ...((prev[sectionKey] || {})[item] || {}), [colKey]: value } },
    }));
  };
  const updateSimple = (sectionKey, item, value) => {
    setValues((prev) => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), [item]: value } }));
  };
  const updateCheck = (key, value) => {
    setValues((prev) => ({ ...prev, headerChecks: { ...(prev.headerChecks || {}), [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  };

  return (
    <div>
      <PlanillaSaveBar onSave={handleSave} saving={saving} onPrint={() => printPlanilla({ tipo: "B", budget })} />

      <div id="printable-planilla" className="print-area bg-white border border-gray-200 rounded-2xl p-5 print:border-0 print:p-0">
        <h3 className="font-display text-xl text-zinc-950 mb-1">DrunkCoq / Logística — Planilla B</h3>
        <p className="text-xs text-gray-400 mb-4">Mercadería y consumos</p>
        <PlanillaHeader
          budget={budget}
          checks={values.headerChecks || {}}
          headerChecks={PLANILLA_B_HEADER_CHECKS}
          onChangeCheck={updateCheck}
        />

        {PLANILLA_B_TABLE_SECTIONS.map((section) => (
          <PlanillaTable
            key={section.key}
            title={section.title}
            columns={section.columns}
            items={section.items}
            values={values[section.key] || {}}
            onChangeCell={(item, colKey, v) => updateCell(section.key, item, colKey, v)}
          />
        ))}

        {PLANILLA_B_LABELED_SECTIONS.map((section) => (
          <PlanillaLabeledGrid
            key={section.key}
            title={section.title}
            items={section.items}
            values={values[section.key] || {}}
            onChangeItem={(index, v) => updateSimple(section.key, index, v)}
          />
        ))}

        {PLANILLA_B_NUMBER_SECTIONS.map((section) => (
          <PlanillaNumberGrid
            key={section.key}
            title={section.title}
            items={section.items}
            values={values[section.key] || {}}
            onChangeItem={(item, v) => updateSimple(section.key, item, v)}
          />
        ))}

        {PLANILLA_B_STOCK_TABLE_SECTIONS.map((section) => (
          <PlanillaTable
            key={section.key}
            title={section.title}
            columns={section.columns}
            items={section.items}
            values={values[section.key] || {}}
            onChangeCell={(item, colKey, v) => updateCell(section.key, item, colKey, v)}
            showIndex={false}
          />
        ))}
      </div>
    </div>
  );
}

function PlanillaPage({ eyebrow, title, subtitle, budgets, products, planillaType, renderForm }) {
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [mode, setMode] = useState("form"); // 'form' | 'retorno'
  const [planilla, setPlanilla] = useState(null);
  const [search, setSearch] = useState("");

  const numbers = useSequentialNumbers(budgets);
  const budget = budgets.find((b) => b.id === selectedBudgetId);
  const planillaId = selectedBudgetId ? `${selectedBudgetId}_${planillaType}` : null;

  const filteredBudgets = useMemo(
    () => budgets.filter((b) => b.eventType.toLowerCase().includes(search.toLowerCase()) || b.venue.toLowerCase().includes(search.toLowerCase())),
    [budgets, search]
  );

  useEffect(() => {
    if (!planillaId) { setPlanilla(null); return; }
    return subscribePlanilla(planillaId, setPlanilla);
  }, [planillaId]);

  return (
    <div>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <p className="text-sm text-gray-400 -mt-4 mb-6">{subtitle}</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-6 no-print">
        <FieldLabel>Elegí un presupuesto</FieldLabel>
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar presupuesto por evento o salón…" />
          <Select
            value={selectedBudgetId}
            onChange={setSelectedBudgetId}
            className="min-w-[260px]"
            options={[
              <option key="" value="">Seleccionar presupuesto…</option>,
              ...filteredBudgets.map((b) => (
                <option key={b.id} value={b.id}>
                  #{String(numbers[b.id] || 0).padStart(3, "0")} · {b.eventType} · {b.venue} · {formatDate(b.date)}
                </option>
              )),
            ]}
          />
        </div>
      </div>

      {!budget ? (
        <EmptyState icon={Printer} message="Elegí un presupuesto arriba para ver su planilla." />
      ) : (
        <>
          <div className="flex gap-2 mb-4 no-print">
            <button
              onClick={() => setMode("form")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "form" ? "bg-zinc-950 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              Completar planilla
            </button>
            <button
              onClick={() => setMode("retorno")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "retorno" ? "bg-zinc-950 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              Registrar retorno
            </button>
          </div>

          {mode === "form" ? (
            renderForm({ budget, planilla, onSave: (data) => savePlanilla(planillaId, data) })
          ) : (
            <ReturnEditor
              budget={budget}
              products={products}
              planilla={planilla}
              planillaId={planillaId}
              planillaType={planillaType}
            />
          )}
        </>
      )}
    </div>
  );
}

function PlanillaHerramientasSection({ budgets, products, loading }) {
  return (
    <PlanillaPage
      eyebrow="Planillas · ♠"
      title="Herramientas y Logística"
      subtitle="Planilla A — completá el armado del evento o registrá el retorno para actualizar el Stock."
      budgets={budgets}
      products={products}
      planillaType="A"
      renderForm={({ budget, planilla, onSave }) => <PlanillaA budget={budget} planilla={planilla} onSave={onSave} />}
    />
  );
}

function PlanillaMercaderiaSection({ budgets, products, loading }) {
  return (
    <PlanillaPage
      eyebrow="Planillas · ♠"
      title="Mercadería y Consumos"
      subtitle="Planilla B — completá el armado del evento o registrá el retorno para actualizar el Stock."
      budgets={budgets}
      products={products}
      planillaType="B"
      renderForm={({ budget, planilla, onSave }) => <PlanillaB budget={budget} planilla={planilla} onSave={onSave} />}
    />
  );
}

const NAV_ITEMS = [
  { key: "stock", label: "Stock", icon: Package },
  {
    key: "admin",
    label: "Administración",
    icon: FileText,
    children: [
      { key: "budgets", label: "Presupuestos", icon: FileText },
      { key: "costcenter", label: "Centro de Costos", icon: BarChart3 },
    ],
  },
  {
    key: "planillas",
    label: "Planillas",
    icon: Printer,
    children: [
      { key: "planillas-herramientas", label: "Herramientas", icon: Printer },
      { key: "planillas-mercaderia", label: "Mercadería", icon: Printer },
    ],
  },
  { key: "providers", label: "Proveedores", icon: Users },
];

// Versión "aplanada" de NAV_ITEMS, usada por la barra inferior de mobile
// (ahí no hay espacio para un menú desplegable, así que mostramos todo en fila).
const FLAT_NAV_ITEMS = NAV_ITEMS.flatMap((item) => item.children || [item]);

function Sidebar({ section, setSection }) {
  const [openGroups, setOpenGroups] = useState(() => new Set(["admin", "planillas"]));
  const toggleGroup = (key) => setOpenGroups((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-zinc-950 text-white min-h-screen px-4 py-6 no-print">
      <div className="flex items-center gap-2.5 px-2 mb-10">
        <SpadeMark className="w-6 h-6 text-white" />
        <div>
          <p className="font-display text-lg leading-none tracking-wide">DrunkCoq</p>
          <p className="text-[10px] text-zinc-400 tracking-[0.15em] uppercase">Eventos</p>
        </div>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const childActive = item.children.some((c) => c.key === section);
            const isOpen = openGroups.has(item.key);
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleGroup(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    childActive ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mt-1 ml-4 pl-3 border-l border-zinc-800 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const active = section === child.key;
                      return (
                        <button
                          key={child.key}
                          onClick={() => setSection(child.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                          }`}
                        >
                          <ChildIcon className="w-3.5 h-3.5" />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = section === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-6 border-t border-zinc-800 text-xs text-zinc-500">
        Organización de eventos premium
      </div>
    </aside>
  );
}

function MobileTopbar() {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-zinc-950 text-white sticky top-0 z-30 no-print">
      <div className="flex items-center gap-2">
        <SpadeMark className="w-5 h-5" />
        <p className="font-display text-base tracking-wide">DrunkCoq Eventos</p>
      </div>
    </div>
  );
}

function MobileNav({ section, setSection }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex z-30 no-print">
      {FLAT_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = section === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setSection(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              active ? "text-white" : "text-zinc-500"
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ----------------------------- BANNER DE DATOS DE EJEMPLO ----------------------------- */

function SeedBanner({ onSeed, seeding }) {
  return (
    <div className="bg-zinc-950 text-white rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Database className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Tu base de datos está vacía</p>
          <p className="text-xs text-zinc-400 mt-0.5">Podés cargar datos de ejemplo para ver la app en funcionamiento, o empezar a cargar los tuyos.</p>
        </div>
      </div>
      <button
        onClick={onSeed}
        disabled={seeding}
        className="inline-flex items-center gap-2 bg-white text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-60 transition-colors shrink-0"
      >
        {seeding && <Loader2 className="w-4 h-4 animate-spin" />}
        {seeding ? "Cargando…" : "Cargar datos de ejemplo"}
      </button>
    </div>
  );
}

function ConfigMissing() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <SpadeMark className="w-8 h-8 text-zinc-950 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-zinc-950 mb-2">Falta configurar Firebase</h1>
        <p className="text-sm text-gray-500">
          Creá un archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env</code> en la raíz del proyecto a partir de{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env.example</code> con las credenciales de tu proyecto de Firebase, y reiniciá el servidor.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------- APP ----------------------------- */

export default function App() {
  const firebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

  const [section, setSection] = useState("stock");

  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [movements, setMovements] = useState([]);
  const [stockCategories, setStockCategories] = useState([]);
  const [providerCategories, setProviderCategories] = useState([]);
  const [planillas, setPlanillas] = useState([]);

  const [loaded, setLoaded] = useState({ products: false, providers: false, budgets: false });
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsubProducts = subscribeProducts((data) => { setProducts(data); setLoaded((l) => ({ ...l, products: true })); });
    const unsubProviders = subscribeProviders((data) => { setProviders(data); setLoaded((l) => ({ ...l, providers: true })); });
    const unsubBudgets = subscribeBudgets((data) => { setBudgets(data); setLoaded((l) => ({ ...l, budgets: true })); });
    const unsubMovements = subscribeMovements(setMovements);
    const unsubStockCategories = subscribeStockCategories(setStockCategories);
    const unsubProviderCategories = subscribeProviderCategories(setProviderCategories);
    const unsubPlanillas = subscribePlanillas(setPlanillas);
    return () => {
      unsubProducts(); unsubProviders(); unsubBudgets(); unsubMovements();
      unsubStockCategories(); unsubProviderCategories(); unsubPlanillas();
    };
  }, [firebaseConfigured]);

  if (!firebaseConfigured) return <ConfigMissing />;

  const ready = loaded.products && loaded.providers && loaded.budgets;
  const isEmpty = ready && products.length === 0 && providers.length === 0 && budgets.length === 0;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar los datos de ejemplo. Revisá las reglas de seguridad de Firestore.");
    }
    setSeeding(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar section={section} setSection={setSection} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 pb-24 md:pb-10 max-w-6xl w-full mx-auto">
          {isEmpty && <SeedBanner onSeed={handleSeed} seeding={seeding} />}
          {section === "stock" && <StockSection products={products} categories={stockCategories} providers={providers} movements={movements} loading={!loaded.products} />}
          {section === "budgets" && <AdminSection budgets={budgets} providers={providers} loading={!loaded.budgets} />}
          {section === "costcenter" && (
            <CostCenterSection
              products={products}
              budgets={budgets}
              planillas={planillas}
              categories={stockCategories}
              loading={!loaded.products || !loaded.budgets}
            />
          )}
          {section === "providers" && <ProvidersSection providers={providers} categories={providerCategories} loading={!loaded.providers} />}
          {section === "planillas-herramientas" && <PlanillaHerramientasSection budgets={budgets} products={products} loading={!loaded.budgets} />}
          {section === "planillas-mercaderia" && <PlanillaMercaderiaSection budgets={budgets} products={products} loading={!loaded.budgets} />}
        </main>
      </div>

      <MobileNav section={section} setSection={setSection} />
    </div>
  );
}
