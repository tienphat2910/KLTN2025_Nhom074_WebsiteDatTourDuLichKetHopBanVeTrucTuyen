const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload avatar to Cloudinary
const uploadAvatar = async (file, userId) => {
    try {
        console.log('Starting Cloudinary upload for user:', userId);
        console.log('File path:', file.path);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'LuTrip/avatars',
            public_id: `avatar_${userId}_${Date.now()}`,
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            overwrite: true
        });

        console.log('Cloudinary upload successful:', result.secure_url);

        // Clean up temporary file
        try {
            await fs.unlink(file.path);
            console.log('Temporary file cleaned up');
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError.message);
        }

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Clean up temporary file on error
        try {
            await fs.unlink(file.path);
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file after error:', cleanupError.message);
        }

        throw new Error(`Upload failed: ${error.message}`);
    }
};

// Delete avatar from Cloudinary
const deleteAvatar = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary delete result:', result);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
    }
};

// Upload destination image to Cloudinary
const uploadDestinationImage = async (file, destinationId) => {
    try {
        console.log('Starting Cloudinary upload for destination:', destinationId);
        console.log('File path:', file.path);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'LuTrip/destinations',
            public_id: `destination_${destinationId}_${Date.now()}`,
            transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            overwrite: true
        });

        console.log('Cloudinary upload successful:', result.secure_url);

        // Clean up temporary file
        try {
            await fs.unlink(file.path);
            console.log('Temporary file cleaned up');
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError.message);
        }

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Clean up temporary file on error
        try {
            await fs.unlink(file.path);
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file after error:', cleanupError.message);
        }

        throw new Error(`Upload failed: ${error.message}`);
    }
};

// Delete destination image from Cloudinary
const deleteDestinationImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary delete result:', result);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
    }
};

// Upload tour image to Cloudinary
const uploadTourImage = async (file, tourId) => {
    try {
        console.log('Starting Cloudinary upload for tour:', tourId);
        console.log('File path:', file.path);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'LuTrip/tours',
            public_id: `tour_${tourId}_${Date.now()}`,
            transformation: [
                { width: 1200, height: 800, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            overwrite: true
        });

        console.log('Cloudinary upload successful:', result.secure_url);

        // Clean up temporary file
        try {
            await fs.unlink(file.path);
            console.log('Temporary file cleaned up');
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError.message);
        }

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Clean up temporary file on error
        try {
            await fs.unlink(file.path);
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file after error:', cleanupError.message);
        }

        throw new Error(`Upload failed: ${error.message}`);
    }
};

// Delete tour image from Cloudinary
const deleteTourImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary delete result:', result);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
    }
};

// Upload activity image to Cloudinary
const uploadActivityImage = async (file, activityId) => {
    try {
        console.log('Starting Cloudinary upload for activity:', activityId);
        console.log('File path:', file.path);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'LuTrip/activities',
            public_id: `activity_${activityId}_${Date.now()}`,
            transformation: [
                { width: 1200, height: 800, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            overwrite: true
        });

        console.log('Cloudinary upload successful:', result.secure_url);

        // Clean up temporary file
        try {
            await fs.unlink(file.path);
            console.log('Temporary file cleaned up');
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError.message);
        }

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Clean up temporary file on error
        try {
            await fs.unlink(file.path);
        } catch (cleanupError) {
            console.warn('Failed to clean up temporary file after error:', cleanupError.message);
        }

        throw new Error(`Upload failed: ${error.message}`);
    }
};

// Delete activity image from Cloudinary
const deleteActivityImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary delete result:', result);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
    }
};

module.exports = {
    uploadAvatar,
    deleteAvatar,
    uploadDestinationImage,
    deleteDestinationImage,
    uploadTourImage,
    deleteTourImage,
    uploadActivityImage,
    deleteActivityImage
};
