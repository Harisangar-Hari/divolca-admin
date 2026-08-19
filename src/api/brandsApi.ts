import { api } from "./axios";

// GET ALL BRANDS
export const getBrands = async () => {
    const res = await api.get("/brands");

    console.log("RAW BRANDS RESPONSE:", res.data);

    // Since your controller returns straight from Prisma, 
    // it might return capital Id and Name. We map it to standard camelCase.
    return res.data.map((b: any) => ({
        id: b.Id || b.id,
        name: b.Name || b.name
    }));
};

// CREATE NEW BRAND
export const createBrand = async (data: { name: string }) => {
    const res = await api.post("/brands", data);
    return res.data;
};

// GET BRAND BY ID (Optional, if needed)
export const getBrand = async (id: string) => {
    const res = await api.get(`/brands/${id}`);
    return res.data;
};

// DELETE BRAND
export const deleteBrand = async (id: string) => {
    const res = await api.delete(`/brands/${id}`);
    return res.data;
};