export interface SaleItem {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface SaleDetail {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    createdAt: string;
    items: SaleItem[];
}

export interface SaleListItem {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    createdAt: string;
    itemsCount: number;
}