import { useCallback, useEffect, useMemo, useState } from "react";
import { buildPublicCartLineId, calculatePublicItemLineTotalCents } from "./public-store-item";

const STORAGE_KEY = "public-store-cart";
const CHANGE_EVENT = "public-store-cart:change";

export interface PublicCartItemAdditional {
  groupId: string;
  optionId: string;
  groupName: string;
  optionName: string;
  priceDeltaCents: number;
}

export interface PublicCartItem {
  lineId: string;
  recipeId: string;
  baseName: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  fillingRecipeIds: string[];
  fillingNames: string[];
  additionals: PublicCartItemAdditional[];
}

function readCart() {
  if (typeof window === "undefined") {
    return [] as PublicCartItem[];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [] as PublicCartItem[];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PublicCartItem[]) : [];
  } catch {
    return [] as PublicCartItem[];
  }
}

function writeCart(items: PublicCartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function usePublicCart() {
  const [items, setItems] = useState<PublicCartItem[]>(() => readCart());

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const addItem = useCallback((item: Omit<PublicCartItem, "lineId">) => {
    const lineId = buildPublicCartLineId(
      item.recipeId,
      item.fillingRecipeIds,
      item.additionals,
    );
    const current = readCart();
    const existing = current.find((entry) => entry.lineId === lineId);
    const next = existing
      ? current.map((entry) =>
          entry.lineId === lineId
            ? { ...entry, quantity: entry.quantity + item.quantity }
            : entry,
        )
      : [...current, { ...item, lineId }];

    writeCart(next);
  }, []);

  const replaceItem = useCallback(
    (previousLineId: string, item: Omit<PublicCartItem, "lineId">) => {
      const current = readCart().filter((entry) => entry.lineId !== previousLineId);
      const lineId = buildPublicCartLineId(
        item.recipeId,
        item.fillingRecipeIds,
        item.additionals,
      );
      const existing = current.find((entry) => entry.lineId === lineId);
      const next = existing
        ? current.map((entry) =>
            entry.lineId === lineId
              ? { ...entry, quantity: entry.quantity + item.quantity }
              : entry,
          )
        : [...current, { ...item, lineId }];

      writeCart(next);
    },
    [],
  );

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const current = readCart();
    const next =
      quantity <= 0
        ? current.filter((item) => item.lineId !== lineId)
        : current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item));
    writeCart(next);
  }, []);

  const removeItem = useCallback((lineId: string) => {
    writeCart(readCart().filter((item) => item.lineId !== lineId));
  }, []);

  const clear = useCallback(() => {
    writeCart([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + calculatePublicItemLineTotalCents(item), 0),
    [items],
  );

  return {
    items,
    itemCount,
    totalCents,
    addItem,
    replaceItem,
    updateQuantity,
    removeItem,
    clear,
  };
}
