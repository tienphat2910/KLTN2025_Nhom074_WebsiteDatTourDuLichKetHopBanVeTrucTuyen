const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const { createCanvas } = require('canvas');
const JsBarcode = require('jsbarcode');

/**
 * Generate QR code from booking data and upload to Cloudinary
 * @param {Object} bookingData - Booking information
 * @param {String} bookingData.bookingId - Booking ID
 * @param {String} bookingData.bookingType - Type: 'flight' or 'activity'
 * @param {String} bookingData.code - Booking code or flight code
 * @returns {Promise<Object>} QR code URL and data
 */
const generateQRCode = async (bookingData) => {
    try {
        const { bookingId, bookingType, code } = bookingData;

        // Create QR code data
        const qrData = {
            bookingId: bookingId,
            type: bookingType,
            code: code,
            timestamp: new Date().toISOString(),
            verifyUrl: `${process.env.CLIENT_URL}/verify-booking/${bookingId}`
        };

        // Convert to JSON string
        const qrDataString = JSON.stringify(qrData);

        // Generate QR code as base64 data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(qrCodeDataURL, {
            folder: 'lutrip/qrcodes',
            public_id: `qr_${bookingType}_${bookingId}`,
            resource_type: 'image',
            overwrite: true
        });

        console.log(`✅ QR code generated and uploaded for ${bookingType} booking: ${bookingId}`);

        return {
            success: true,
            qrCodeUrl: uploadResult.secure_url,
            qrCodePublicId: uploadResult.public_id,
            qrData: qrData
        };
    } catch (error) {
        console.error('❌ QR code generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate QR code as base64 without uploading (for email embedding)
 * @param {Object} bookingData - Booking information
 * @returns {Promise<String>} Base64 QR code data URL
 */
const generateQRCodeBase64 = async (bookingData) => {
    try {
        const { bookingId, bookingType, code } = bookingData;

        const qrData = {
            bookingId: bookingId,
            type: bookingType,
            code: code,
            timestamp: new Date().toISOString(),
            verifyUrl: `${process.env.CLIENT_URL}/verify-booking/${bookingId}`
        };

        const qrDataString = JSON.stringify(qrData);

        // Generate QR code as base64
        const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('❌ QR code base64 generation error:', error);
        return null;
    }
};

/**
 * Generate barcode from booking reference
 * @param {String} bookingReference - Booking reference code
 * @returns {Promise<Object>} Barcode URL and public ID
 */
const generateBarcode = async (bookingReference) => {
    try {
        // Create canvas for barcode
        const canvas = createCanvas(300, 100);

        JsBarcode(canvas, bookingReference, {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            background: '#ffffff',
            lineColor: '#000000',
            margin: 10
        });

        // Convert to base64
        const barcodeDataURL = canvas.toDataURL('image/png');

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(barcodeDataURL, {
            folder: 'lutrip/barcodes',
            public_id: `barcode_${bookingReference}`,
            resource_type: 'image',
            overwrite: true
        });

        console.log(`✅ Barcode generated for booking: ${bookingReference}`);

        return {
            success: true,
            barcodeUrl: uploadResult.secure_url,
            barcodePublicId: uploadResult.public_id
        };
    } catch (error) {
        console.error('❌ Barcode generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate barcode as base64 (for email embedding)
 * @param {String} bookingReference - Booking reference code
 * @returns {Promise<String>} Base64 barcode data URL
 */
const generateBarcodeBase64 = (bookingReference) => {
    try {
        const canvas = createCanvas(300, 100);

        JsBarcode(canvas, bookingReference, {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            background: '#ffffff',
            lineColor: '#000000',
            margin: 10
        });

        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('❌ Barcode base64 generation error:', error);
        return null;
    }
};

module.exports = {
    generateQRCode,
    generateQRCodeBase64,
    generateBarcode,
    generateBarcodeBase64,
    // Alias for compatibility
    uploadQRCodeToCloudinary: async (buffer, publicId) => {
        try {
            const base64 = buffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            const uploadResult = await cloudinary.uploader.upload(dataUrl, {
                folder: 'lutrip/qrcodes',
                public_id: publicId,
                resource_type: 'image',
                overwrite: true
            });
            return uploadResult;
        } catch (error) {
            console.error('❌ Upload QR code error:', error);
            throw error;
        }
    }
};
