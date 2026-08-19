import { api } from "./axios";

export const getCategories = async () => {
  const res = await api.get("/categories");
  return res.data.map((c: any) => ({

    id: c.Id,

    name: c.Name

  }));
};

export const createCategory = async (data: any) => {
  const res = await api.post("/categories", data);
  return res.data;
};

export const updateCategory = async (id: string, data: any) => {
  const res = await api.put(`/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id: string) => {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
};