import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User.model';
import AcademicStructure from '../models/AcademicStructure.model';
import { STRUCTURE_CYCLES } from './seedStructureData';
import { logger } from '../utils/logger';

dotenv.config();

import { users as exampleUsers } from '../config/users.example';

let users = exampleUsers;
try {
    // Try to load actual users config if it exists
    const config = require('../config/users');
    if (config.users) {
        users = config.users;
    }
} catch (error) {
    // Ignore error, use example users
    // console.warn('Using example users for seeding. Create src/config/users.ts for custom users.');
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
