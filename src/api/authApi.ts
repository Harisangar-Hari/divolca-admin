import { api } from "./axios";

export const loginApi = async (data: {
    username: string;
    password: string;
}) => {
    const res = await api.post("/auth/login", data);
    return res.data;
};