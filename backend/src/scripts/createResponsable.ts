import connectDB from '../config/database';
import User from '../models/User.model';
import { logger } from '../utils/logger';

const createResponsable = async () => {
    try {
        await connectDB();

        logger.info('Creating responsable account...');

        // Check if responsable already exists
        const existingUser = await User.findOne({ email: 'responsable@ensa.ac.ma' });

        if (existingUser) {
            logger.info('Responsable account already exists');
            process.exit(0);
        }

        // Create responsable account
        const responsable = await User.create({
            email: 'responsable@ensa.ac.ma',
            password: 'Responsable@123', // Will be hashed automatically
            role: 'responsable',
            firstName: 'Ahmed',
            lastName: 'Benali',
            assignedYear: '1ère Année',
            assignedFiliere: 'Tronc Commun',
            isActive: true,
        });

        logger.success('✅ Responsable account created');
        logger.info('   Email: responsable@ensa.ac.ma');
        logger.info('   Password: Responsable@123 (CHANGE THIS!)');
        logger.info(`   Assigned: ${responsable.assignedYear} - ${responsable.assignedFiliere}`);

        process.exit(0);
    } catch (error: any) {
        logger.error('❌ Error creating responsable:', error.message);
        process.exit(1);
    }
};

createResponsable();
