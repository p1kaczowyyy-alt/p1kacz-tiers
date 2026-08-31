import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CategoryRow } from '../types/database';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (!active) return;
      if (error) setError(error.message);
      else setCategories((data ?? []) as CategoryRow[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
