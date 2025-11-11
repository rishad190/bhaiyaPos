"use client";
import React from "react";
import { DataProvider } from "@/app/data-context";

export const ClientProvider = React.memo(function ClientProvider({ children }) {
  return <DataProvider>{children}</DataProvider>;
});
