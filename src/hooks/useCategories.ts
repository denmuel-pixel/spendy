"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
  isDefault: boolean;
}

// Module-level cache — shared across all component instances
let cachedCategories: Category[] | null = null;
let fetchPromise: Promise<void> | null = null;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [isLoading, setIsLoading] = useState(!cachedCategories);
  const mountedRef = useRef(true);

  const fetchCategories = useCallback(async () => {
    // If already cached, use cache immediately
    if (cachedCategories) {
      setCategories(cachedCategories);
      setIsLoading(false);
      return;
    }

    // If already fetching, wait for that promise
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          const res = await fetch("/api/categories");
          const data = await res.json();
          if (data.categories) {
            cachedCategories = data.categories;
            if (mountedRef.current) {
              setCategories(data.categories);
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
        } finally {
          fetchPromise = null;
          if (mountedRef.current) setIsLoading(false);
        }
      })();
    }

    await fetchPromise;
    if (mountedRef.current && cachedCategories) {
      setCategories(cachedCategories);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCategories();
    return () => { mountedRef.current = false; };
  }, [fetchCategories]);

  return { categories, isLoading, refetch: () => { cachedCategories = null; fetchCategories(); } };
}
