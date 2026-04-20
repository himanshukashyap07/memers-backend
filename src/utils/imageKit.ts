import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
});

export const uploadOnImageKit = async (fileBuffer: Buffer, fileName: string): Promise<any> => {
    if (!fileBuffer) return null;

    try {
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: "/memers",
        });

        return response;
    } catch (error) {
        console.error("ImageKit upload error:", error);
        return null;
    }
};