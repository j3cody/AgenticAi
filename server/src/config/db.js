/**
 * Database Configuration
 * Connects to MongoDB using Mongoose
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * Uses the connection string from environment variables
 */
const connectDB = async () => {
  try {
    // Validate MONGODB_URI is configured
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('YOUR_USERNAME') || process.env.MONGODB_URI.includes('xxxxx')) {
      console.error('\n\x1b[31m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
      console.error('\x1b[31m%s\x1b[0m', '║  ❌ MongoDB Not Configured!                                ║');
      console.error('\x1b[31m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
      console.error('\n\x1b[33m%s\x1b[0m', 'You need to set up MongoDB before running this server.\n');
      console.error('\x1b[36m%s\x1b[0m', 'Option 1: MongoDB Atlas (Recommended - Free)');
      console.error('  1. Go to https://www.mongodb.com/cloud/atlas/register');
      console.error('  2. Create a free cluster');
      console.error('  3. Click Connect → Connect your application');
      console.error('  4. Copy the connection string');
      console.error('  5. Replace MONGODB_URI in server/.env\n');
      console.error('\x1b[36m%s\x1b[0m', 'Option 2: Local MongoDB');
      console.error('  1. Install MongoDB from mongodb.com');
      console.error('  2. Start MongoDB service');
      console.error('  3. Uncomment the local MongoDB URI in server/.env\n');
      console.error('\x1b[32m%s\x1b[0m', 'Current .env file: server/.env\n');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`\x1b[32mMongoDB Connected: ${conn.connection.host}\x1b[0m`);
  } catch (error) {
    console.error('\n\x1b[31m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
    console.error('\x1b[31m%s\x1b[0m', '║  ❌ MongoDB Connection Failed                              ║');
    console.error('\x1b[31m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
    console.error(`\n\x1b[31mError: ${error.message}\x1b[0m\n`);
    console.error('\x1b[33mCheck your MONGODB_URI in server/.env\x1b[0m\n');
    process.exit(1);
  }
};

module.exports = connectDB;