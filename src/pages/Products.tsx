// src/pages/Products.tsx
import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
} from "../api/productsApi";
import {
  uploadProductImage
} from "../api/uploadApi";

import ProductForm from "../components/forms/ProductForm";
import { getCategories } from "../api/categoriesApi";
import { getBrands } from "../api/brandsApi";
import ExcelImportModal from "../components/ExcelImportModal";
import { api } from "../api/axios";

interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  price: number;
  costPrice: number;
  discount: number;
  stockQty: number;
  reorderLevel: number;
  categoryId?: string;
  brandId?: string;
  description?: string;
  warrantyMonths?: number;
  imageUrl?: string;
  unit?: string;
  categories?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    sku: "",
    description: "",
    price: 0,
    costPrice: 0,
    discount: 0,
    stockQty: 0,
    reorderLevel: 0,
    warrantyMonths: 0,
    imageUrl: "",
    unit: "pcs",
    categoryId: "",
    brandId: "",
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      console.log("PRODUCTS:", data);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      console.log("BRANDS:", data);
      setBrands(data);
    } catch (err) {
      console.error("Failed to load brands", err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const fetchBrands = async () => {
    const data = await getBrands();
    setBrands(data);
  };

  const openCreate = () => {
    setForm({
      name: "",
      barcode: "",
      sku: "",
      description: "",
      price: 0,
      costPrice: 0,
      discount: 0,
      stockQty: 0,
      reorderLevel: 0,
      warrantyMonths: 0,
      imageUrl: "",
      unit: "pcs",
      categoryId: "",
      brandId: "",
    });
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      barcode: p.barcode,
      sku: p.sku,
      description: p.description || "",
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      discount: Number(p.discount),
      stockQty: p.stockQty,
      reorderLevel: p.reorderLevel,
      warrantyMonths: p.warrantyMonths ?? 0,
      imageUrl: p.imageUrl || "",
      unit: p.unit || "pcs",
      categoryId: p.categoryId || "",
      brandId: p.brandId || "",
    });
    setEditId(p.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      let imageUrl = form.imageUrl || "";

      if (imageFile) {
        const uploadResult = await uploadProductImage(imageFile);
        imageUrl = uploadResult.url;
      }

      const productData = {
        ...form,
        imageUrl
      };

      if (editId) {
        await updateProduct(editId, productData);
      } else {
        await createProduct(productData);
      }

      setImageFile(null);
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  // ✅ Handle bulk import from Excel
  const handleBulkImport = async (productsToImport: any[]) => {
    setIsImporting(true);
    try {
      const processedProducts = [];

      for (const item of productsToImport) {
        let categoryId: string | null = null;
        let brandId: string | null = null;

        // Find or create category
        if (item.categoryName) {
          let category = categories.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
          if (!category) {
            // ✅ Create new category and ensure we get a valid response
            const newCategory = await findOrCreateCategory(item.categoryName);
            if (newCategory && newCategory.id) {
              category = newCategory;
              // ✅ Only update state if we have a valid category
              setCategories(prev => [...prev, category!]);
            } else {
              console.error('Failed to create category:', item.categoryName);
            }
          }
          // ✅ Only set categoryId if category exists
          if (category) {
            categoryId = category.id;
          }
        }

        // Find or create brand
        if (item.brandName) {
          let brand = brands.find(b => b.name.toLowerCase() === item.brandName.toLowerCase());
          if (!brand) {
            // ✅ Create new brand and ensure we get a valid response
            const newBrand = await findOrCreateBrand(item.brandName);
            if (newBrand && newBrand.id) {
              brand = newBrand;
              // ✅ Only update state if we have a valid brand
              setBrands(prev => [...prev, brand!]);
            } else {
              console.error('Failed to create brand:', item.brandName);
            }
          }
          // ✅ Only set brandId if brand exists
          if (brand) {
            brandId = brand.id;
          }
        }

        processedProducts.push({
          ...item,
          categoryId,
          brandId,
        });
      }

      // ✅ Bulk import the products
      const result = await bulkImportProducts(processedProducts);
      await loadProducts();
      setIsImportModalOpen(false);
      alert(`Successfully imported ${result?.imported || processedProducts.length} products!`);
    } catch (error: any) {
      console.error("Bulk import failed:", error);
      alert(error?.message || "Failed to import products");
    } finally {
      setIsImporting(false);
    }
  };

  // Helper functions for creating category and brand
  const findOrCreateCategory = async (name: string): Promise<Category | null> => {
    try {
      // 1. Check if category already exists in database
      const existingCategories = await api.get("/categories");
      const existingCategory = existingCategories.data.find(
        (c: any) => c.Name.toLowerCase() === name.toLowerCase()
      );

      if (existingCategory) {
        return existingCategory;
      }

      // 2. If not exists, create new category
      const res = await api.post("/categories", { name });
      const newCategory = res.data;

      if (newCategory && newCategory.id) {
        // Update local state with new category
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      }
      return null;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  };

  // ✅ Helper: Find or create brand (checks database directly)
  const findOrCreateBrand = async (name: string): Promise<Brand | null> => {
    try {
      // 1. Check if brand already exists in database
      const existingBrands = await api.get("/brands");
      const existingBrand = existingBrands.data.find(
        (b: any) => b.Name.toLowerCase() === name.toLowerCase()
      );

      if (existingBrand) {
        return existingBrand;
      }

      // 2. If not exists, create new brand
      const res = await api.post("/brands", { name });
      const newBrand = res.data;

      if (newBrand && newBrand.id) {
        // Update local state with new brand
        setBrands(prev => [...prev, newBrand]);
        return newBrand;
      }
      return null;
    } catch (error) {
      console.error('Error creating brand:', error);
      return null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-black/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#14181C]">
            Products
          </h1>
          <p className="text-[13px] text-black/40 mt-0.5">
            {products.length} {products.length === 1 ? "product" : "products"} in catalog
          </p>
        </div>

        <div className="flex gap-2">
          {/* ✅ Import Excel Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import Excel
          </button>

          <button
            onClick={openCreate}
            className="bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add product
          </button>
        </div>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden space-y-3">
        {products.length === 0 && (
          <div className="bg-white rounded-2xl border border-black/5 py-12 text-center text-black/30 text-sm">
            No products yet — add your first one
          </div>
        )}

        {products.map((p) => {
          const category = categories.find(c => c.id === p.categoryId);
          const lowStock = p.stockQty <= p.reorderLevel;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-[#14181C] text-[15px]">
                  {p.name}
                </div>
                {lowStock && (
                  <span className="text-[10px] font-semibold tracking-wide uppercase bg-red-50 text-red-600 px-2 py-1 rounded-full shrink-0">
                    Low stock
                  </span>
                )}
              </div>

              <div className="text-[12px] text-black/40 font-mono">
                {p.barcode}
              </div>

              <div className="flex justify-between text-sm pt-1">
                <span className="text-black/40 text-[12px] uppercase tracking-wide font-semibold">Price</span>
                <span className="font-mono font-semibold">Rs {p.price}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-black/40 text-[12px] uppercase tracking-wide font-semibold">Stock</span>
                <span className={`font-mono font-semibold ${lowStock ? "text-red-600" : ""}`}>
                  {p.stockQty}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-black/40 text-[12px] uppercase tracking-wide font-semibold">Category</span>
                <span>{category ? category.name : "—"}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 py-2 rounded-xl font-medium text-[13px] cursor-pointer transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl font-medium text-[13px] cursor-pointer transition"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-black/5 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-left text-black/40">
            <tr className="border-b border-black/5">
              <th className="p-4 font-semibold text-[11px] uppercase tracking-widest">Image</th>
              <th className="p-4 font-semibold text-[11px] uppercase tracking-widest">Name</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest">Barcode</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest">Brand</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest">Price</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest">Discount</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest">Stock</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest">Category</th>
              <th className="font-semibold text-[11px] uppercase tracking-widest text-right pr-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="p-10 text-center text-black/30">
                  No products yet — add your first one
                </td>
              </tr>
            )}

            {products.map((p) => {
              const category = categories.find(c => c.id === p.categoryId);
              const lowStock = p.stockQty <= p.reorderLevel;

              return (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                >
                  <td className="p-4">
                    {p.imageUrl ? (
                      <img
                        src={`http://localhost:3003${p.imageUrl}`}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-black/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F3F6F4] flex items-center justify-center text-black/30 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-[#14181C]">
                    {p.name}
                  </td>

                  <td className="font-mono text-black/50">{p.barcode}</td>
                  <td className="font-mono text-black/50">{p.brand?.name || "—"}</td>
                  <td className="font-mono font-semibold">Rs {p.price}</td>
                  <td className="font-mono font-semibold">Rs {p.discount}</td>

                  <td>
                    <span className={`font-mono font-semibold ${lowStock ? "text-red-600" : ""}`}>
                      {p.stockQty}
                    </span>
                    {lowStock && (
                      <span className="ml-2 text-[10px] font-semibold tracking-wide uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                        Low
                      </span>
                    )}
                  </td>

                  <td className="text-black/60">
                    {category ? category.name : "—"}
                  </td>

                  <td className="p-2 pr-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-lg font-medium cursor-pointer transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium cursor-pointer transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-xl flex flex-col">
            {/* HEADER */}
            <div className="p-6 border-b border-black/5">
              <h2 className="text-lg font-semibold text-[#14181C]">
                {editId ? "Edit product" : "Add product"}
              </h2>
            </div>

            {/* SCROLL AREA */}
            <div className="overflow-y-auto px-6 py-5">
              <ProductForm
                form={form}
                setForm={setForm}
                categories={categories}
                brands={brands}
                setImageFile={setImageFile}
                refreshCategories={fetchCategories}
                refreshBrands={fetchBrands}
              />
            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-2 p-6 border-t border-black/5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px]"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXCEL IMPORT MODAL ================= */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        isLoading={isImporting}
      />
    </div>
  );
}