import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bouquet from './models/Bouquet';
import { bouquets } from '../src/app/data/bouquets';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evelinas-flowershop';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if bouquets already exist
    const existing = await Bouquet.countDocuments();
    if (existing > 0) {
      console.log(`Database already has ${existing} bouquets. Skipping seed.`);
      process.exit(0);
    }

    // Transform the bouquets data to match the schema (remove id, add timestamps)
    const bouquetDocs = bouquets.map(({ id, ...rest }) => ({
      ...rest,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    console.log(`Seeding ${bouquetDocs.length} bouquets...`);
    await Bouquet.insertMany(bouquetDocs);
    console.log('Database seeded successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();