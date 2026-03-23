import { useState, useEffect } from "react";

// Hook para gerenciar estado mockado com persistência simples no localStorage
export function useMockData<T>(key: string, initialData: T[]) {
  const [data, setData] = useState<T[]>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing ${key} from localStorage`, e);
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [data, key]);

  return [data, setData] as const;
}
