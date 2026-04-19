import ImageKit from "imagekit";
import fs from "fs";
import path from "path";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
});

export const uploadOnImageKit = async (localFilePath: string): Promise<any> => {
    if (!localFilePath) return null;

    try {
        const fileBuffer = fs.readFileSync(localFilePath);

        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: path.basename(localFilePath),
            folder: "/memers",
        });

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        console.error("ImageKit upload error:", error);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};