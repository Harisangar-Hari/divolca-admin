import { useEffect, useState } from "react";
import { getProducts } from "../api/productsApi";
import { api } from "../api/axios";
import { useToast } from "../store/toastStore";
import { getSuppliers, createSupplier } from "../api/supplierApi";
import ProductForm from "../components/forms/ProductForm";
import { getCategories } from "../api/categoriesApi";
import { getBrands } from "../api/brandsApi";
import { uploadProductImage } from "../api/uploadApi";

interface Product {
    id: string;
    name: string;
    costPrice: number;
    stockQty: number;
    price?: number;
    barcode?: string;
    sku?: string;
    description?: string;
    discount?: number;
    reorderLevel?: number;
    warrantyMonths?: number;
    imageUrl?: string;
    unit?: string;
    categoryId?: string;
    brandId?: string;
    categories?: { id: string; name: string };
    brand?: { id: string; name: string };
}

interface Supplier {
    id: string;
    name: string;
    phone: string;
}

interface CartItem {
    productId: string;
    name: string;
    quantity: number;
    costPrice: number;
}

interface Category {
    id: string;
    name: string;
}

interface Brand {
    id: string;
    name: string;
}

export default function Purchases() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    // ✅ Purchase Number - Manual input from company
    const [purchaseNumber, setPurchaseNumber] = useState("");

    const [productSearch, setProductSearch] = useState("");

    const { showToast } = useToast();

    // Product Form Modal States
    const [showProductModal, setShowProductModal] = useState(false);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [editProductId, setEditProductId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    console.log("editProductId", editProductId);
    // Log the imageFile state to check if it's being set correctly
    // Supplier Modal States
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierPhone, setNewSupplierPhone] = useState("");
    const [newSupplierEmail, setNewSupplierEmail] = useState("");
    const [newSupplierAddress, setNewSupplierAddress] = useState("");

    // Categories & Brands for Product Form
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    // Product Form State
    const [productForm, setProductForm] = useState({
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
        loadSuppliers();
        loadCategories();
        loadBrands();
    }, []);

    const loadProducts = async () => {
        const res = await getProducts();
        setProducts(res);
    };

    const loadSuppliers = async () => {
        try {
            const res = await getSuppliers();
            setSuppliers(res);
        } catch {
            showToast("Failed to load suppliers", "error");
        }
    };

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch {
            console.error("Failed to load categories");
        }
    };

    const loadBrands = async () => {
        try {
            const data = await getBrands();
            setBrands(data);
        } catch {
            console.error("Failed to load brands");
        }
    };

    const refreshCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    const refreshBrands = async () => {
        const data = await getBrands();
        setBrands(data);
    };

    const addToCart = (p: Product) => {
        const exists = cart.find(c => c.productId === p.id);

        if (exists) {
            setCart(
                cart.map(c =>
                    c.productId === p.id
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    productId: p.id,
                    name: p.name,
                    quantity: 1,
                    costPrice: p.costPrice,
                },
            ]);
        }
    };

    const updateQty = (id: string, qty: number) => {
        setCart(
            cart.map(c =>
                c.productId === id ? { ...c, quantity: qty } : c
            )
        );
    };

    const updateCostPrice = (id: string, price: number) => {
        setCart(
            cart.map(c =>
                c.productId === id ? { ...c, costPrice: price } : c
            )
        );
    };

    const removeItem = (id: string) => {
        setCart(cart.filter(c => c.productId !== id));
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const total = cart.reduce(
        (sum, i) => sum + i.costPrice * i.quantity,
        0
    );

    const handleAddProduct = async () => {
        try {
            let imageUrl = productForm.imageUrl || "";

            if (imageFile) {
                const uploadResult = await uploadProductImage(imageFile);
                imageUrl = uploadResult.url;
            }

            const productData = {
                ...productForm,
                imageUrl
            };

            await api.post("/products", productData);
            await loadProducts();
            resetProductForm();
            setShowProductModal(false);
            showToast("Product added successfully", "success");
        } catch (error: any) {
            showToast(error?.response?.data?.message || "Failed to add product", "error");
        }
    };

    const resetProductForm = () => {
        setProductForm({
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
        setImageFile(null);
        setIsEditingProduct(false);
        setEditProductId(null);
    };

    const submitPurchase = async () => {
        if (!selectedSupplierId)
            return showToast("Select supplier", "error");

        if (cart.length === 0)
            return showToast("Cart empty", "error");

        // ✅ Validate Purchase Number
        if (!purchaseNumber || purchaseNumber.trim() === "")
            return showToast("Please enter a Purchase Number", "error");

        try {
            const payload = {
                purchaseNumber: purchaseNumber, // ✅ Send custom Purchase Number
                supplierId: selectedSupplierId,
                purchaseDate: purchaseDate,
                items: cart.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    costPrice: i.costPrice,
                })),
            };

            console.log("Sending payload:", payload);

            const response = await api.post("/purchases", payload);
            console.log("Purchase response:", response.data);

            showToast(`Purchase "${purchaseNumber}" saved successfully!`, "success");

            // Reset form
            setCart([]);
            setSelectedSupplierId("");
            setPurchaseDate(new Date().toISOString().split("T")[0]);
            setPurchaseNumber(""); // ✅ Clear Purchase Number
            loadProducts();
        } catch (error: any) {
            console.error("Purchase error:", error);
            showToast(error?.response?.data?.message || "Failed to save purchase", "error");
        }
    };

    const handleAddSupplier = async () => {
        if (!newSupplierName || !newSupplierPhone)
            return showToast("Enter supplier name & phone", "error");

        try {
            const res = await createSupplier({
                name: newSupplierName,
                phone: newSupplierPhone,
                email: newSupplierEmail,
                address: newSupplierAddress,
            });

            setSuppliers((prev) => [...prev, res]);
            setSelectedSupplierId(res.id);

            setShowSupplierModal(false);

            setNewSupplierName("");
            setNewSupplierPhone("");
            setNewSupplierEmail("");
            setNewSupplierAddress("");

            showToast("Supplier added", "success");
        } catch {
            showToast("Failed to add supplier", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">

                {/* LEFT: PRODUCTS */}
                <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Products
                        </h2>
                        <button
                            onClick={() => {
                                resetProductForm();
                                setShowProductModal(true);
                            }}
                            className="text-[#0B6E4F] text-[13px] font-medium hover:underline cursor-pointer"
                        >
                            + Add Product
                        </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#FAFAF8] mb-3 focus-within:ring-2 focus-within:ring-[#0B6E4F]/30 focus-within:border-[#0B6E4F] transition">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="ml-3 shrink-0 text-black/35">
                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <input
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full py-2.5 pr-3 bg-transparent text-[14px] cursor-text outline-none placeholder:text-black/30"
                        />
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="py-12 text-center text-black/30 text-sm">
                            {products.length === 0 ? "No products found" : "No products match your search"}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="border border-black/10 p-3 rounded-xl cursor-pointer hover:border-[#0B6E4F]/40 hover:bg-[#F3F6F4] transition"
                                >
                                    <p className="font-medium text-[14px]">{p.name}</p>
                                    <p className="text-[12px] text-black/40 mt-1">
                                        Stock: <span className="font-mono">{p.stockQty}</span>
                                    </p>
                                    <p className="text-[12px] text-[#0B6E4F] font-mono font-semibold mt-0.5">
                                        Rs {p.costPrice}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: CART */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 space-y-3">
                    {/* ✅ PURCHASE NUMBER - Manual Input */}
                    <div>
                        <label className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Purchase Number *
                        </label>
                        <input
                            type="text"
                            value={purchaseNumber}
                            onChange={(e) => setPurchaseNumber(e.target.value)}
                            placeholder="Enter Purchase Number (e.g., 11098)"
                            className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] font-mono outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                        />
                        <p className="text-[10px] text-black/30 mt-1">Enter the Purchase Number provided by the company</p>
                    </div>

                    {/* PURCHASE DATE */}
                    <div>
                        <label className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Purchase Date
                        </label>
                        <input
                            type="date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <h3 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Supplier
                        </h3>

                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="text-[#4338CA] text-[13px] font-medium hover:underline cursor-pointer"
                        >
                            + Add supplier
                        </button>
                    </div>

                    {/* SUPPLIER SELECT */}
                    <select
                        className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-pointer text-[14px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                        <option value="">Select supplier</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} - {s.phone}
                            </option>
                        ))}
                    </select>

                    {cart.length === 0 ? (
                        <div className="py-8 text-center text-black/30 text-sm">
                            Tap a product to add it to this purchase
                        </div>
                    ) : (
                        <div className="divide-y divide-dashed divide-black/10">
                            {cart.map(i => (
                                <div key={i.productId} className="py-3 space-y-2 first:pt-0">

                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-[14px]">{i.name}</p>
                                        <button
                                            onClick={() => removeItem(i.productId)}
                                            className="text-red-500/70 hover:text-red-600 cursor-pointer transition"
                                            aria-label="Remove item"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-8 0l1 13a2 2 0 002 2h4a2 2 0 002-2l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {/* COST PRICE */}
                                        <div>
                                            <label className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                                Cost price
                                            </label>
                                            <input
                                                type="number"
                                                value={i.costPrice}
                                                onChange={(e) =>
                                                    updateCostPrice(
                                                        i.productId,
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-2 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                            />
                                        </div>

                                        {/* QUANTITY */}
                                        <div>
                                            <label className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                value={i.quantity}
                                                onChange={(e) =>
                                                    updateQty(i.productId, Number(e.target.value))
                                                }
                                                className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-2 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TOTAL */}
                    <div className="bg-[#12171A] rounded-2xl p-4">
                        <p className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Total
                        </p>
                        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[#4ADE9A] [text-shadow:0_0_18px_rgba(74,222,154,0.35)]">
                            Rs {total}
                        </p>
                    </div>

                    <button
                        onClick={submitPurchase}
                        className="w-full bg-[#0B6E4F] hover:bg-[#0A5F44] text-white p-3.5 rounded-2xl font-semibold tracking-wide cursor-pointer transition shadow-sm"
                    >
                        Save purchase
                    </button>
                </div>

            </div>

            {/* SUPPLIER MODAL */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-5 rounded-2xl w-full max-w-sm space-y-3 shadow-xl">

                        <h2 className="text-[15px] font-semibold">Add supplier</h2>

                        <input
                            placeholder="Name"
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                        />

                        <input
                            placeholder="Phone"
                            value={newSupplierPhone}
                            onChange={(e) => setNewSupplierPhone(e.target.value)}
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                        />

                        <input
                            placeholder="Email"
                            value={newSupplierEmail}
                            onChange={(e) => setNewSupplierEmail(e.target.value)}
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                        />

                        <textarea
                            placeholder="Address"
                            value={newSupplierAddress}
                            onChange={(e) => setNewSupplierAddress(e.target.value)}
                            rows={3}
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition resize-none"
                        />

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleAddSupplier}
                                className="flex-1 bg-[#4338CA] hover:bg-[#372FA6] text-white p-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition"
                            >
                                Save
                            </button>

                            <button
                                onClick={() => setShowSupplierModal(false)}
                                className="flex-1 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 p-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition"
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* PRODUCT FORM MODAL */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-xl flex flex-col">
                        <div className="p-6 border-b border-black/5">
                            <h2 className="text-lg font-semibold text-[#14181C]">
                                {isEditingProduct ? "Edit product" : "Add product"}
                            </h2>
                        </div>

                        <div className="overflow-y-auto px-6 py-5">
                            <ProductForm
                                form={productForm}
                                setForm={setProductForm}
                                categories={categories}
                                brands={brands}
                                setImageFile={setImageFile}
                                refreshCategories={refreshCategories}
                                refreshBrands={refreshBrands}
                            />
                        </div>

                        <div className="flex justify-end gap-2 p-6 border-t border-black/5">
                            <button
                                onClick={() => {
                                    resetProductForm();
                                    setShowProductModal(false);
                                }}
                                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px]"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleAddProduct}
                                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px]"
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