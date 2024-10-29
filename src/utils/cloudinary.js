import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: `Videotube/${folder}`
        });
        if (response) {
            console.log('Successfully file uploaded to cloudinary!', response.url);
        }
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // Deletes or removes the file locally as the upload gets failed
        return null
    }
}

export const deleteFromCloudinary = async (publicId) => {
    try {
        const response = await cloudinary.uploader.destroy(publicId);

        if (response.result === 'ok') {
            console.log('Photo deleted successfully from Cloudinary!');
        } else {
            console.log('Failed to delete photo:', response.result);
        }
        return response;
    } catch (error) {
        console.error('Error deleting photo from Cloudinary:', error);
        return null;
    }
};

export const deleteMultipleFromCloudinary = async (publicIds) => {
    try {
        const response = await cloudinary.api.delete_resources(publicIds);

        if (response.result === 'ok') {
            console.log('Photo deleted successfully from Cloudinary!');
        } else {
            console.log('Failed to delete photo:', response.result);
        }
        return response;
    } catch (error) {
        console.error('Error deleting photo from Cloudinary:', error);
        return null;
    }
};

export const getThumbnail = (videoPublicId) => {
    try {
        const response = cloudinary.url(videoPublicId, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [
                { width: 300, height: 200, crop: 'fill' }, // Thumbnail size
                { start_offset: 'auto' } // Cloudinary picks the best frame automatically
            ]
        });
        return response;
    } catch (error) {
        console.log('Error while getting thumbnail image', error);
        return nulll
    }
}
