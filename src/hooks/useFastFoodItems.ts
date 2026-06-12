import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FastFoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FastFoodFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  isActive: boolean;
  sortOrder: string;
}

export const fastFoodCategories = ["Burgers", "Grillades", "Sandwichs & Wraps", "Pizza", "Boissons"];

export const useFastFoodItems = () => {
  const [items, setItems] = useState<FastFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("fastfood_items")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching fastfood items:", error);
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const createItem = async (formData: FastFoodFormData, imageUrl: string | null) => {
    const { error } = await supabase.from("fastfood_items").insert({
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      image: imageUrl,
      is_active: formData.isActive,
      sort_order: parseInt(formData.sortOrder) || 0,
    });
    if (error) throw error;
    await fetchItems();
  };

  const updateItem = async (id: string, formData: FastFoodFormData, imageUrl?: string | null) => {
    const updateData: any = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      is_active: formData.isActive,
      sort_order: parseInt(formData.sortOrder) || 0,
    };
    if (imageUrl !== undefined) {
      updateData.image = imageUrl;
    }
    const { error } = await supabase.from("fastfood_items").update(updateData).eq("id", id);
    if (error) throw error;
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("fastfood_items").delete().eq("id", id);
    if (error) throw error;
    await fetchItems();
  };

  return { items, isLoading, fetchItems, createItem, updateItem, deleteItem };
};
