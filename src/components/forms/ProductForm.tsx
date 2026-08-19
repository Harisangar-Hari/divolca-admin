import { useEffect, useState } from "react";
import Input from "../ui/Input";
import { printBarcode } from "../../utils/printBarcode";
import { createCategory } from "../../api/categoriesApi";
import { createBrand } from "../../api/brandsApi";

interface Props {
  form: any;
  setForm: (v: any) => void;
  categories: any[];
  brands: any[];
  setImageFile: (file: File | null) => void;
  refreshCategories: () => void; // New prop to refresh list after adding
  refreshBrands: () => void;     // New prop to refresh list after adding
}

function generateBarcode() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${timestamp}${random}`;
}

export default function ProductForm({
  form,
  setForm,
  categories,
  brands,
  setImageFile,
  refreshCategories,
  refreshBrands,
}: Props) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(form.imageUrl || null);

  // Quick Add States
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  useEffect(() => {
    if (!form.barcode) {
      setForm({
        ...form,
        barcode: generateBarcode(),
      });
    }
  }, []);

  const handleOpenPrintModal = () => {
    if (!form.barcode) return;
    setPrintCopies(1);
    setIsPrintModalOpen(true);
  };

  const handleConfirmPrint = () => {
    if (printCopies < 1) return;
    printBarcode({
      productName: form.name || "Unnamed product",
      barcode: form.barcode,
      price: form.price,
      copies: printCopies,
    });
    setIsPrintModalOpen(false);
  };

  // Handle Quick Add Category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await createCategory({ name: newCategoryName });
      // Reset input and close
      setNewCategoryName("");
      setShowAddCategory(false);
      // Refresh the parent's category list
      if (refreshCategories) refreshCategories();

      // Auto-select the newly created category
      // Prisma usually returns 'Id' and 'Name'. Adjust if your API returns 'id' and 'name'
      const newId = newCat.Id || newCat.id;
      setForm({ ...form, categoryId: newId });
    } catch (error) {
      console.error("Failed to add category", error);
      alert("Failed to add category.");
    }
  };

  // Handle Quick Add Brand
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      const newBrand = await createBrand({ name: newBrandName });
      // Reset input and close
      setNewBrandName("");
      setShowAddBrand(false);
      // Refresh the parent's brand list
      if (refreshBrands) refreshBrands();

      // Auto-select the newly created brand
      const newId = newBrand.Id || newBrand.id;
      setForm({ ...form, brandId: newId });
    } catch (error) {
      console.error("Failed to add brand", error);
      alert("Failed to add brand.");
    }
  };

  return (
    <div className="space-y-6">
      {/* IDENTITY */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
          Identity
        </p>

        <Input
          label="Product Name"
          placeholder="Enter product name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input
              label="Barcode"
              placeholder="Auto-generated"
              value={form.barcode}
              onChange={(e) =>
                setForm({
                  ...form,
                  barcode: e.target.value,
                })
              }
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    barcode: generateBarcode(),
                  })
                }
                className="text-[#4338CA] text-[12px] font-medium hover:underline cursor-pointer"
              >
                Generate new
              </button>

              <button
                type="button"
                onClick={handleOpenPrintModal}
                disabled={!form.barcode}
                className="text-[#0B6E4F] disabled:text-black/30 disabled:cursor-not-allowed text-[12px] font-medium hover:underline cursor-pointer"
              >
                Print barcode
              </button>
            </div>
          </div>

          <Input
            label="SKU"
            placeholder="Stock keeping unit"
            value={form.sku}
            onChange={(e) =>
              setForm({
                ...form,
                sku: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* PRICING */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
          Pricing
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Selling Price"
            type="number"
            placeholder="0.00"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: Number(e.target.value),
              })
            }
          />

          <Input
            label="Cost Price"
            type="number"
            placeholder="0.00"
            value={form.costPrice}
            onChange={(e) =>
              setForm({
                ...form,
                costPrice: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* DISCOUNT + UNIT */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
          Additional Pricing
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Discount"
            type="number"
            placeholder="0"
            value={form.discount}
            onChange={(e) =>
              setForm({
                ...form,
                discount: Number(e.target.value),
              })
            }
          />

          <Input
            label="Unit"
            placeholder="pcs"
            value={form.unit}
            onChange={(e) =>
              setForm({
                ...form,
                unit: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* STOCK */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
          Stock
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Stock Quantity"
            type="number"
            placeholder="0"
            value={form.stockQty}
            onChange={(e) =>
              setForm({
                ...form,
                stockQty: Number(e.target.value),
              })
            }
          />

          <Input
            label="Reorder Level"
            type="number"
            placeholder="Minimum stock alert"
            value={form.reorderLevel}
            onChange={(e) =>
              setForm({
                ...form,
                reorderLevel: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* ORGANIZATION - UPDATED SECTION */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
          Organization
        </p>

        {/* Category Dropdown with Add Button */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] text-black/60 font-medium">Category</label>
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="text-[12px] text-[#4338CA] font-medium hover:underline cursor-pointer"
            >
              + Add Category
            </button>
          </div>

          {showAddCategory ? (
            <div className="flex gap-2 bg-[#FAFAF8] p-2 border border-black/10 rounded-xl">
              <input
                type="text"
                autoFocus
                placeholder="New category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") setShowAddCategory(false);
                }}
                className="flex-1 outline-none text-[14px] bg-transparent p-1"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1 bg-[#0B6E4F] text-white text-[12px] rounded-lg font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-2 py-1 text-black/60 text-[12px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryId: e.target.value,
                })
              }
              className="border border-black/10 bg-[#FAFAF8] p-2.5 rounded-xl text-[14px] cursor-pointer outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Brand Dropdown with Add Button */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] text-black/60 font-medium">Brand</label>
            <button
              type="button"
              onClick={() => setShowAddBrand(true)}
              className="text-[12px] text-[#4338CA] font-medium hover:underline cursor-pointer"
            >
              + Add Brand
            </button>
          </div>

          {showAddBrand ? (
            <div className="flex gap-2 bg-[#FAFAF8] p-2 border border-black/10 rounded-xl">
              <input
                type="text"
                autoFocus
                placeholder="New brand name..."
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddBrand();
                  if (e.key === "Escape") setShowAddBrand(false);
                }}
                className="flex-1 outline-none text-[14px] bg-transparent p-1"
              />
              <button
                type="button"
                onClick={handleAddBrand}
                className="px-3 py-1 bg-[#0B6E4F] text-white text-[12px] rounded-lg font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddBrand(false)}
                className="px-2 py-1 text-black/60 text-[12px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <select
              value={form.brandId}
              onChange={(e) =>
                setForm({
                  ...form,
                  brandId: e.target.value,
                })
              }
              className="border border-black/10 bg-[#FAFAF8] p-2.5 rounded-xl text-[14px] cursor-pointer outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
          Product Information
        </p>

        <Input
          label="Description"
          placeholder="Enter product description"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Warranty Months"
            type="number"
            placeholder="0"
            value={form.warrantyMonths}
            onChange={(e) =>
              setForm({
                ...form,
                warrantyMonths: Number(e.target.value),
              })
            }
          />

          <div className="space-y-2">
            <label className="text-[13px] text-black/60 font-medium">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  const preview = URL.createObjectURL(file);
                  setImagePreview(preview);
                }
              }}
              className="border border-black/10 bg-[#FAFAF8] p-2.5 rounded-xl text-sm w-full"
            />
            {imagePreview && (
              <img
                src={
                  imagePreview.startsWith("blob:")
                    ? imagePreview
                    : `http://localhost:3003${imagePreview}`
                }
                alt="preview"
                className="mt-3 h-32 w-32 object-cover rounded-xl border"
              />
            )}
          </div>
        </div>
      </div>

      {/* PRINT BARCODE MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-[#14181C]">
              Print barcode stickers
            </h2>
            <p className="text-[13px] text-black/60">
              How many stickers do you want to print?
            </p>
            <input
              type="number"
              min="1"
              max="100"
              value={printCopies}
              onChange={(e) => setPrintCopies(Number(e.target.value))}
              className="border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-center w-full"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#F3F6F4] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPrint}
                className="flex-1 px-4 py-2.5 bg-[#0B6E4F] text-white rounded-xl"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}