const { storage } = require('../config/firebase');
const { ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

// Upload file to Firebase Storage
const uploadFile = async (file, folder = 'uploads') => {
    try {
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}_${file.originalname}`;
        const storageRef = ref(storage, fileName);

        const snapshot = await uploadBytes(storageRef, file.buffer, {
            contentType: file.mimetype
        });

        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            url: downloadURL,
            path: fileName
        };
    } catch (error) {
        console.error('Firebase upload error:', error);
        throw new Error('Lỗi upload file');
    }
};

// Delete file from Firebase Storage
const deleteFile = async (filePath) => {
    try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        return true;
    } catch (error) {
        console.error('Firebase delete error:', error);
        return false;
    }
};

// Upload avatar specifically
const uploadAvatar = async (file, userId) => {
    return await uploadFile(file, `avatars/${userId}`);
};

// Upload tour images
const uploadTourImages = async (files, tourId) => {
    const uploadPromises = files.map(file =>
        uploadFile(file, `tours/${tourId}`)
    );
    return await Promise.all(uploadPromises);
};

// Upload hotel images
const uploadHotelImages = async (files, hotelId) => {
    const uploadPromises = files.map(file =>
        uploadFile(file, `hotels/${hotelId}`)
    );
    return await Promise.all(uploadPromises);
};

module.exports = {
    uploadFile,
    deleteFile,
    uploadAvatar,
    uploadTourImages,
    uploadHotelImages
};
