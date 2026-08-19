import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categoriesApi";

interface Category {
  id: string;
  name: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  const openCreate = () => {
    setName("");
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setName(cat.name);
    setEditId(cat.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (editId) {
      await updateCategory(editId, { name });
    } else {
      await createCategory({ name });
    }

    setIsModalOpen(false);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    await deleteCategory(id);
    loadCategories();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
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
            Categories
          </h1>
          <p className="text-[13px] text-black/40 mt-0.5">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add category
        </button>

      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">

        {categories.length === 0 && (
          <div className="py-12 text-center text-black/30 text-sm">
            No categories yet — add your first one
          </div>
        )}

        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between px-4 py-3.5 border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
          >

            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B6E4F]" />
              <span className="font-medium text-[14px] text-[#14181C]">
                {c.name}
              </span>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() => openEdit(c)}
                className="px-3 py-1.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-lg font-medium text-[13px] cursor-pointer transition"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(c.id)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-[13px] cursor-pointer transition"
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">

            <h2 className="text-lg font-semibold text-[#14181C]">
              {editId ? "Edit category" : "Add category"}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-black/60 font-medium">
                Category name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beverages"
                className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] cursor-pointer transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm"
              >
                Save
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}