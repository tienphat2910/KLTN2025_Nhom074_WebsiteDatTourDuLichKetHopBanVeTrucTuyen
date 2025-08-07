"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type LoadingType = "navigation" | "auth" | "content" | null;

interface LoadingContextType {
  isLoading: boolean;
  loadingType: LoadingType;
  startLoading: (type: LoadingType) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  loadingType: null,
  startLoading: () => {},
  stopLoading: () => {}
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<LoadingType>(null);

  const startLoading = (type: LoadingType) => {
    setIsLoading(true);
    setLoadingType(type);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingType(null);
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, loadingType, startLoading, stopLoading }}
    >
      {children}
    </LoadingContext.Provider>
  );
};
