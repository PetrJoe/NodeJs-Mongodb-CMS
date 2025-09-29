#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const { seedDatabase } = require('./src/utils/seeder');

const connectAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await seedDatabase();

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

connectAndSeed();