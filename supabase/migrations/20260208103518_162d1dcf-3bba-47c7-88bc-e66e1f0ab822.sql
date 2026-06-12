-- Add stock quantity column to products table
ALTER TABLE public.products 
ADD COLUMN stock_quantity integer DEFAULT 0;

-- Update existing products: set stock_quantity based on in_stock
UPDATE public.products 
SET stock_quantity = CASE WHEN in_stock = true THEN 100 ELSE 0 END;