import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User.model';
import AcademicStructure from '../models/AcademicStructure.model';
import { STRUCTURE_CYCLES } from './seedStructureData';
import { logger } from '../utils/logger';

dotenv.config();

const seedDatabase = async () => {
    try {
        logger.info('Starting database seeding...');

        // Connect to database
        await connectDB();

        // Create superadmin account
        const superadminEmail = 'admin@ensa.ac.ma';
        const existingSuperadmin = await User.findOne({ email: superadminEmail });

        if (!existingSuperadmin) {
            await User.create({
                email: superadminEmail,
                password: 'Admin@123', // Change this in production!
                role: 'superadmin',
                firstName: 'Super',
                lastName: 'Admin',
            });
            logger.success('✅ Superadmin account created');
            logger.info(`   Email: ${superadminEmail}`);
            logger.info(`   Password: Admin@123 (CHANGE THIS!)`);
        } else {
            logger.info('ℹ️  Superadmin account already exists');
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
