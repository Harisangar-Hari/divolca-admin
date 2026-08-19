// components/ExcelImportModal.tsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "../store/toastStore";

interface ExcelProduct {
    item_code: string;
    barcode: string;
    item_name: string;
    brand: string;
    category: string;
    QTY: number;
    cost_price: number;
    selling_price: number;
}

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (products: any[]) => Promise<void>;
    isLoading?: boolean;
}

export default function ExcelImportModal({
    isOpen,
    onClose,
    onImport,
    isLoading = false,
}: ExcelImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ExcelProduct[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");
    const { showToast } = useToast();
    console.log("file", file);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Check if it's an Excel file
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];
        if (!validTypes.includes(selectedFile.type)) {
            showToast("Please upload an Excel file (.xlsx or .xls)", "error");
            return;
        }

        setFile(selectedFile);
        readExcelFile(selectedFile);
    };

    const readExcelFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Map the columns to our expected format
                const mappedData: ExcelProduct[] = jsonData.map((row: any) => ({
                    item_code: row.item_code || row["item_code"] || row["Item Code"] || "",
                    barcode: row.barcode || row["barcode"] || row["Barcode"] || "",
                    item_name: row.item_name || row["item_name"] || row["Item Name"] || "",
                    brand: row.brand || row["brand"] || row["Brand"] || "",
                    category: row.category || row["category"] || row["Category"] || "",
                    QTY: Number(row.QTY || row["QTY"] || row["Quantity"] || 0),
                    cost_price: Number(row.cost_price || row["cost_price"] || row["Cost Price"] || 0),
                    selling_price: Number(row.selling_price || row["selling_price"] || row["Selling Price"] || 0),
                }));

                // Auto-generate barcodes for empty ones
                const processedData = mappedData.map((item, index) => ({
                    ...item,
                    barcode: item.barcode || `BAR-${Date.now()}-${String(index + 1).padStart(4, '0')}`,
                }));

                setPreviewData(processedData);
                setStep("preview");
                showToast(`Loaded ${processedData.length} products from Excel`, "success");
            } catch (error) {
                showToast("Failed to read Excel file. Please check the format.", "error");
                console.error("Excel read error:", error);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (previewData.length === 0) {
            showToast("No data to import", "error");
            return;
        }

        setStep("importing");
        try {
            // Transform data to match product schema
            const productsToImport = previewData.map((item) => ({
                name: item.item_name,
                barcode: item.barcode,
                sku: item.item_code || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                price: item.selling_price,
                costPrice: item.cost_price,
                stockQty: item.QTY,
                reorderLevel: 5, // Default value
                unit: "pcs",
                description: `Imported from Excel - ${item.item_code}`,
                warrantyMonths: 0,
                categoryName: item.category,
                brandName: item.brand,
                discount: 0,
                isActive: true,
            }));

            await onImport(productsToImport);
            showToast(`Successfully imported ${previewData.length} products`, "success");
            setStep("upload");
            setPreviewData([]);
            setFile(null);
            onClose();
        } catch (error: any) {
            showToast(error?.message || "Failed to import products", "error");
            setStep("preview");
        }
    };

    const handleClose = () => {
        setStep("upload");
        setPreviewData([]);
        setFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[#14181C]">Import Products from Excel</h2>
                        <p className="text-sm text-black/40 mt-0.5">
                            Upload an Excel file with product data
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-black/30 hover:text-black/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6">
                    {step === "upload" && (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#0B6E4F] transition">
                                <div className="text-4xl mb-3">📊</div>
                                <p className="text-sm font-medium text-gray-600">
                                    Drop your Excel file here or click to browse
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Supports .xlsx and .xls files
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#0B6E4F] file:text-white hover:file:bg-[#0A5F44] cursor-pointer"
                                />
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                                <p className="font-semibold">Required Excel Columns:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                                    <li><strong>item_code</strong> - Product code/SKU</li>
                                    <li><strong>barcode</strong> - Barcode (leave empty to auto-generate)</li>
                                    <li><strong>item_name</strong> - Product name</li>
                                    <li><strong>brand</strong> - Brand name</li>
                                    <li><strong>category</strong> - Category name</li>
                                    <li><strong>QTY</strong> - Quantity/Stock</li>
                                    <li><strong>cost_price</strong> - Cost price</li>
                                    <li><strong>selling_price</strong> - Selling price</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    {previewData.length} products ready to import
                                </p>
                                <button
                                    onClick={() => setStep("upload")}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    ← Choose different file
                                </button>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 text-left font-semibold text-gray-600">#</th>
                                            <th className="p-3 text-left font-semibold text-gray-600">Item Code</th>
                                            <th className="p-3 text-left font-semibold text-gray-600">Barcode</th>
                                            <th className="p-3 text-left font-semibold text-gray-600">Item Name</th>
                                            <th className="p-3 text-left font-semibold text-gray-600">Brand</th>
                                            <th className="p-3 text-left font-semibold text-gray-600">Category</th>
                                            <th className="p-3 text-right font-semibold text-gray-600">QTY</th>
                                            <th className="p-3 text-right font-semibold text-gray-600">Cost Price</th>
                                            <th className="p-3 text-right font-semibold text-gray-600">Selling Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 20).map((item, index) => (
                                            <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                                                <td className="p-3 text-gray-400">{index + 1}</td>
                                                <td className="p-3 font-mono text-xs">{item.item_code}</td>
                                                <td className="p-3 font-mono text-xs">
                                                    <span className={item.barcode ? "text-green-600" : "text-yellow-600"}>
                                                        {item.barcode || "Auto-generated"}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-medium">{item.item_name}</td>
                                                <td className="p-3">{item.brand}</td>
                                                <td className="p-3">{item.category}</td>
                                                <td className="p-3 text-right">{item.QTY}</td>
                                                <td className="p-3 text-right">Rs {item.cost_price.toFixed(2)}</td>
                                                <td className="p-3 text-right font-semibold">Rs {item.selling_price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {previewData.length > 20 && (
                                            <tr>
                                                <td colSpan={9} className="p-3 text-center text-gray-400 text-sm">
                                                    ... and {previewData.length - 20} more products
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-700">
                                <p>⚠️ Products without barcodes will be auto-generated with format: <strong>BAR-{Date.now()}-XXXX</strong></p>
                                <p className="text-xs mt-1">Brands and Categories that don't exist will be created automatically.</p>
                            </div>
                        </div>
                    )}

                    {step === "importing" && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0B6E4F] border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Importing products... Please wait.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== "importing" && (
                    <div className="p-6 border-t border-black/5 flex justify-end gap-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] cursor-pointer transition"
                        >
                            Cancel
                        </button>
                        {step === "preview" && (
                            <button
                                onClick={handleImport}
                                disabled={isLoading || previewData.length === 0}
                                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Import {previewData.length} Products
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}