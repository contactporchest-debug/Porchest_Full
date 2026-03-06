const mongoose = require('mongoose');

const connectDB = async () => {
  // Reuse existing connection in serverless warm instances
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't process.exit in serverless — throw instead so the request fails gracefully
    throw error;
  }
};

module.exports = connectDB;
