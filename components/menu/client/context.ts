"use client";

import { createContext, useContext } from "react";
import type { MenuClientData } from "../client-data";

export type Panel =
  | { type: "product"; id: string }
  | { type: "info" }
  | { type: "language" }
  | { type: "search" };

export const MenuContext = createContext<{
  data: MenuClientData;
  open: (panel: Panel) => void;
} | null>(null);

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu, MenuProvider içinde kullanılmalı.");
  return context;
}
