const mongoose = require('mongoose');
require('dotenv').config();

async function fixFirebaseUidIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get existing indexes
        const indexes = await usersCollection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Drop the old firebaseUid index if it exists
        try {
            await usersCollection.dropIndex('firebaseUid_1');
            console.log('✓ Dropped old firebaseUid_1 index');
        } catch (error) {
            console.log('No firebaseUid_1 index to drop or already dropped');
        }

        // Create new sparse unique index
        await usersCollection.createIndex(
            { firebaseUid: 1 },
            { unique: true, sparse: true }
        );
        console.log('✓ Created new sparse unique index for firebaseUid');

        // Verify the new indexes
        const newIndexes = await usersCollection.indexes();
        console.log('\nNew indexes:', JSON.stringify(newIndexes, null, 2));

        console.log('\n✓ Index migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing firebaseUid index:', error);
        process.exit(1);
    }
}

fixFirebaseUidIndex();
