import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User.model';
import AcademicStructure from '../models/AcademicStructure.model';
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

        // Create sample academic structure
        const existingStructure = await AcademicStructure.findOne();

        if (!existingStructure) {
            await AcademicStructure.create({
                years: [
                    {
                        name: '1ère Année',
                        filieres: [
                            {
                                name: 'Tronc Commun',
                                modules: [
                                    'Mathématiques 1',
                                    'Physique 1',
                                    'Algorithmique',
                                    'Électronique',
                                    'Mécanique',
                                    'Langues et Communication',
                                ],
                            },
                        ],
                    },
                    {
                        name: '2ème Année',
                        filieres: [
                            {
                                name: 'Génie Informatique',
                                modules: [
                                    'Programmation Orientée Objet',
                                    'Structures de Données',
                                    'Bases de Données',
                                    'Réseaux Informatiques',
                                    'Systèmes d\'Exploitation',
                                ],
                            },
                            {
                                name: 'Génie Électrique',
                                modules: [
                                    'Électronique de Puissance',
                                    'Automatique',
                                    'Traitement du Signal',
                                    'Machines Électriques',
                                ],
                            },
                            {
                                name: 'Génie Mécanique',
                                modules: [
                                    'Résistance des Matériaux',
                                    'Thermodynamique',
                                    'Mécanique des Fluides',
                                    'CAO/DAO',
                                ],
                            },
                        ],
                    },
                    {
                        name: '3ème Année',
                        filieres: [
                            {
                                name: 'Génie Informatique',
                                modules: [
                                    'Développement Web',
                                    'Intelligence Artificielle',
                                    'Sécurité Informatique',
                                    'Génie Logiciel',
                                    'Cloud Computing',
                                ],
                            },
                            {
                                name: 'Génie Électrique',
                                modules: [
                                    'Énergies Renouvelables',
                                    'Électronique Embarquée',
                                    'Commande Numérique',
                                ],
                            },
                            {
                                name: 'Génie Mécanique',
                                modules: [
                                    'Fabrication Mécanique',
                                    'Maintenance Industrielle',
                                    'Gestion de Production',
                                ],
                            },
                        ],
                    },
                ],
            });
            logger.success('✅ Sample academic structure created');
        } else {
            logger.info('ℹ️  Academic structure already exists');
        }

        logger.success('🎉 Database seeding completed successfully!');
        process.exit(0);
    } catch (error: any) {
        logger.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
};

seedDatabase();
