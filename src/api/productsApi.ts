import { api } from "./axios";

export const getProducts = async () => {

  const res = await api.get("/products");


  return res.data.map((p: any) => ({

    id: p.Id,

    name: p.Name,

    barcode: p.Barcode,

    sku: p.SKU,


    price: Number(p.Price),

    costPrice: Number(p.CostPrice),


    discount: Number(p.Discount ?? 0),


    stockQty: p.StockQty,

    reorderLevel: p.ReorderLevel,


    unit: p.Unit ?? "pcs",


    categoryId: p.CategoryId,


    category: p.Categories
      ? {
        id: p.Categories.Id,
        name: p.Categories.Name
      }
      : null,



    brandId: p.BrandId,


    brand: p.Brands
      ? {
        id: p.Brands.Id,
        name: p.Brands.Name
      }
      : null,



    description: p.Description ?? "",


    warrantyMonths:
      p.WarrantyMonths ?? 0,


    imageUrl:
      p.ImageUrl ?? ""


  }));

};

export const createProduct = async (data: any) => {
  const res = await api.post("/products", data);
  return res.data;
};

export const updateProduct = async (id: string, data: any) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: string) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

export const bulkImportProducts = async (products: any[]) => {
  const res = await api.post("/products/bulk-import", { products });
  return res.data;
};

// ✅ Create category (if not exists)
export const createCategory = async (data: { name: string }) => {
  const res = await api.post("/categories", data);
  return res.data;
};

// ✅ Create brand (if not exists)
export const createBrand = async (data: { name: string }) => {
  const res = await api.post("/brands", data);
  return res.data;
};