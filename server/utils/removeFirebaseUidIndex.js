const mongoose = require('mongoose');
require('dotenv').config();

async function removeFirebaseUidIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get existing indexes
        const indexes = await usersCollection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Drop the firebaseUid index completely
        try {
            await usersCollection.dropIndex('firebaseUid_1');
            console.log('✓ Dropped firebaseUid_1 index');
        } catch (error) {
            console.log('No firebaseUid_1 index to drop');
        }

        // Verify the new indexes
        const newIndexes = await usersCollection.indexes();
        console.log('\nNew indexes:', JSON.stringify(newIndexes, null, 2));

        console.log('\n✓ Index removal completed successfully!');
        console.log('Note: firebaseUid uniqueness will now be handled at application level');
        process.exit(0);
    } catch (error) {
        console.error('Error removing firebaseUid index:', error);
        process.exit(1);
    }
}

removeFirebaseUidIndex();
