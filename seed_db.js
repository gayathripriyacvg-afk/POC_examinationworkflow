const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Connection URL. Update this if your MongoDB is hosted elsewhere.
const url = 'mongodb://localhost:27017';
const dbName = 'ScannerSystemDB';

async function seedDB() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(dbName);
        
        // Read static JSON file
        const rawData = fs.readFileSync(path.join(__dirname, 'static_logins.json'));
        const logins = JSON.parse(rawData);
        
        // Select 'users' collection
        const usersCollection = db.collection('users');
        
        // Clear existing test users to prevent duplicates on multiple runs
        await usersCollection.deleteMany({});
        
        // Flatten all user arrays into one single array
        const allUsers = [
            ...logins.superAdmin,
            ...logins.organization,
            ...logins.scanner,
            ...logins.answerBookletScanner
        ];
        
        // Insert them into the DB
        const insertResult = await usersCollection.insertMany(allUsers);
        console.log(`Successfully inserted ${insertResult.insertedCount} users into the database.`);
        console.log('Users inserted:', allUsers.map(u => u.username));
        
    } catch (err) {
        console.error('Error seeding DB:', err);
    } finally {
        await client.close();
    }
}

seedDB();
