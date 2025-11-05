"use client";
import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [companyName, setCompanyName] = useState("Sky Fabric's");
  const [companyLogo, setCompanyLogo] = useState("/download.png");

  useEffect(() => {
    const storedCompanyName = localStorage.getItem("companyName");
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }

    const storedCompanyLogo = localStorage.getItem("companyLogo");
    if (storedCompanyLogo) {
      setCompanyLogo(storedCompanyLogo);
    }
  }, []);

  const updateSetting = (key, value) => {
    localStorage.setItem(key, value);
    if (key === "companyName") {
      setCompanyName(value);
    } else if (key === "companyLogo") {
      setCompanyLogo(value);
    }
  };

  return (
    <SettingsContext.Provider
      value={{ companyName, companyLogo, updateSetting }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
