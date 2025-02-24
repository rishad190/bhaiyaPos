"use client";
import { DataProvider } from "@/app/data-context";

export function ClientProvider({ children }) {
  return <DataProvider>{children}</DataProvider>;
}
