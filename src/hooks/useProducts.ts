import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category?: string;
  categorie?: string; // For backward compatibility with existing data
  price: number;
  unit: string | null;
  image?: string | null;
  image_url?: string | null; // For backward compatibility with existing data
  in_stock: boolean;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  price: string;
  unit: string;
  description: string;
  inStock: boolean;
  stockQuantity: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('categorie', { ascending: true })
      .order('name', { ascending: true });

   if (error) {
  console.error("ERREUR SUPABASE AJOUT PRODUIT:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (formData: ProductFormData, imageUrl: string | null) => {
    const stockQty = Number(formData.stockQuantity) || 0;
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: formData.name,
        categorie: formData.category,
        price: Number(formData.price),
        unit: formData.unit || null,
        description: formData.description || null,
        in_stock: formData.inStock,
        stock_quantity: Number(stockQty) || 0,
        image_url: imageUrl || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    setProducts(prev => [data, ...prev]);
    return data;
  };

  const updateProduct = async (id: string, formData: ProductFormData, imageUrl: string | null | undefined) => {
    const stockQty = Number(formData.stockQuantity) || 0;
    const updateData: Partial<Product> = {
      name: formData.name,
      categorie: formData.category,
      price: Number(formData.price),
      unit: formData.unit || null,
      description: formData.description || null,
      in_stock: formData.inStock,
      stock_quantity: stockQty,
    };

    // Only update image if a new one was provided
    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    setProducts(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products') 
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return {
    products,
    isLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
