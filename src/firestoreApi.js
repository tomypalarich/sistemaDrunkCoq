import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { mockProducts, mockProviders, mockBudgets, mockMovements, DEFAULT_STOCK_CATEGORIES, DEFAULT_PROVIDER_CATEGORIES } from "./mockData";

const mapDocs = (snapshot) => snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

/* ----------------------------- SUSCRIPCIONES EN TIEMPO REAL ----------------------------- */

export function subscribeProducts(onChange) {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)));
}

export function subscribeProviders(onChange) {
  const q = query(collection(db, "providers"), orderBy("name"));
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)));
}

export function subscribeBudgets(onChange) {
  const q = query(collection(db, "budgets"), orderBy("date"));
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)));
}

export function subscribeMovements(onChange) {
  const q = query(collection(db, "movements"), orderBy("createdAt", "desc"), limit(8));
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)));
}

export function subscribeStockCategories(onChange) {
  const q = query(collection(db, "stockCategories"), orderBy("name"));
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)));
}

export function subscribeProviderCategories(onChange) {
  const q = query(collection(db, "providerCategories"), orderBy("name"));
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)));
}

/* ----------------------------- PRODUCTOS / STOCK ----------------------------- */

export async function logMovement(text) {
  await addDoc(collection(db, "movements"), { text, createdAt: serverTimestamp() });
}

export async function addProduct(data) {
  await addDoc(collection(db, "products"), data);
  await logMovement(`Se agregó nuevo producto "${data.name}" con ${data.stock} unidades`);
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, "products", id), data);
  await logMovement(`Se actualizó "${data.name}" — stock ahora en ${data.stock}`);
}

export async function deleteProduct(product) {
  await deleteDoc(doc(db, "products", product.id));
  await logMovement(`Se eliminó el producto "${product.name}"`);
}

export async function deleteManyProducts(products) {
  const batch = writeBatch(db);
  products.forEach((p) => batch.delete(doc(db, "products", p.id)));
  await batch.commit();
  await logMovement(`Se eliminaron ${products.length} productos del stock`);
}

/* ----------------------------- CATEGORÍAS ----------------------------- */

export async function addStockCategory(name, existing) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const found = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  const ref = await addDoc(collection(db, "stockCategories"), { name: trimmed });
  return { id: ref.id, name: trimmed };
}

export async function addProviderCategory(name, existing) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const found = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  const ref = await addDoc(collection(db, "providerCategories"), { name: trimmed });
  return { id: ref.id, name: trimmed };
}

/* ----------------------------- PROVEEDORES ----------------------------- */

export async function addProvider(data) {
  await addDoc(collection(db, "providers"), data);
}

export async function updateProvider(id, data) {
  await updateDoc(doc(db, "providers", id), data);
}

export async function deleteProvider(id) {
  await deleteDoc(doc(db, "providers", id));
}

/* ----------------------------- PRESUPUESTOS ----------------------------- */

export async function addBudget(data) {
  await addDoc(collection(db, "budgets"), data);
}

export async function updateBudget(id, data) {
  await updateDoc(doc(db, "budgets", id), data);
}

export async function deleteBudget(id) {
  await deleteDoc(doc(db, "budgets", id));
}

export async function deleteManyBudgets(ids) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, "budgets", id)));
  await batch.commit();
}

/* ----------------------------- CARGA DE DATOS DE EJEMPLO ----------------------------- */

export async function isDatabaseEmpty() {
  const [products, providers, budgets] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "providers")),
    getDocs(collection(db, "budgets")),
  ]);
  return products.empty && providers.empty && budgets.empty;
}

export async function seedDatabase() {
  // Categorías primero.
  for (const name of DEFAULT_STOCK_CATEGORIES) {
    await addDoc(collection(db, "stockCategories"), { name });
  }
  for (const name of DEFAULT_PROVIDER_CATEGORIES) {
    await addDoc(collection(db, "providerCategories"), { name });
  }

  // Proveedores primero, para mapear sus ids reales de Firestore.
  const providerIdMap = {};
  for (const { mockId, ...rest } of mockProviders) {
    const ref = await addDoc(collection(db, "providers"), rest);
    providerIdMap[mockId] = ref.id;
  }

  for (const product of mockProducts) {
    await addDoc(collection(db, "products"), product);
  }

  for (const budget of mockBudgets) {
    await addDoc(collection(db, "budgets"), {
      ...budget,
      providerIds: budget.providerIds.map((mockId) => providerIdMap[mockId]).filter(Boolean),
      contactProviderId: providerIdMap[budget.contactProviderId] || "",
    });
  }

  for (const text of mockMovements) {
    await addDoc(collection(db, "movements"), { text, createdAt: serverTimestamp() });
  }
}
