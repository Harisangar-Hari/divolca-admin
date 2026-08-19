import { api } from "./axios";


export const uploadProductImage = async (
    file: File
) => {


    const formData = new FormData();


    formData.append(
        "image",
        file
    );


    const res = await api.post(
        "/products/upload-image",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );


    return res.data;

};