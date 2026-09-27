import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User.model';
import AcademicStructure from '../models/AcademicStructure.model';
import { STRUCTURE_CYCLES } from './seedStructureData';
import { logger } from '../utils/logger';

dotenv.config();

// Accounts are only seeded from src/config/users.ts (gitignored), never from the public example
let users: any[] = [];
try {
    const config = require('../config/users');
    if (config.users) {
        users = config.users;
    }
} catch (error) {
    logger.warn('No src/config/users.ts found, skipping account seeding.');
}

const seedDatabase = async () => {
    try {
        logger.info('Starting database seeding...');

        // Connect to database
        await connectDB();

        // Seed Users
        for (const user of users) {
            const existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
                await User.create({
                    ...user,
                    password: user.password // Hash this if your model hooks don't handle it, usually they do
                });
                logger.success(`✅ ${user.role} account created: ${user.email}`);
            } else {
                logger.info(`ℹ️  ${user.role} account already exists: ${user.email}`);
            }
        }

        // Delete existing academic structure and create from embedded data
        await AcademicStructure.deleteMany({});
        logger.info('🗑️  Deleted existing academic structure');

        await AcademicStructure.create({
            cycles: STRUCTURE_CYCLES,
        });
        logger.success(`✅ Academic structure created (${STRUCTURE_CYCLES.length} cycles).`);

        logger.success('🎉 Database seeding completed successfully!');
        process.exit(0);
    } catch (error: any) {
        logger.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
};

seedDatabase();
