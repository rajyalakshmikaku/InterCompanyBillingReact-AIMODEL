import { useState, useMemo } from "react";

export default function useSort(data) {
    
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const x = a[sortConfig.key] ?? "";
      const y = b[sortConfig.key] ?? "";

      if (typeof x === "string") return sortConfig.direction === "asc"
        ? x.localeCompare(y)
        : y.localeCompare(x);

      return sortConfig.direction === "asc" ? x - y : y - x;
    });
  }, [data, sortConfig]);

  return { sortedData, sortConfig, requestSort };
}
