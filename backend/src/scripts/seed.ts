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

        // Delete existing academic structure and create new one
        await AcademicStructure.deleteMany({});
        logger.info('🗑️  Deleted existing academic structure');

        await AcademicStructure.create({
            years: [
                // ============================================
                // CYCLE PRÉPARATOIRE (2 years)
                // ============================================
                {
                    name: '1ère Année (2AP1)',
                    cycle: 'CP',
                    filieres: [
                        {
                            code: '2AP',
                            name: 'Cycle Préparatoire',
                            semesters: [
                                {
                                    name: 'S1',
                                    modules: [
                                        'Analyse 1',
                                        'Algèbre 1',
                                        'Mécanique du point',
                                        'Thermodynamique',
                                        'Algorithmique et programmation',
                                        'Langues et Communication 1',
                                    ],
                                },
                                {
                                    name: 'S2',
                                    modules: [
                                        'Analyse 2',
                                        'Algèbre 2',
                                        'Électricité',
                                        'Optique',
                                        'Programmation C',
                                        'Langues et Communication 2',
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    name: '2ème Année (2AP2)',
                    cycle: 'CP',
                    filieres: [
                        {
                            code: '2AP',
                            name: 'Cycle Préparatoire',
                            semesters: [
                                {
                                    name: 'S3',
                                    modules: [
                                        'Analyse 3',
                                        'Probabilités et Statistiques',
                                        'Mécanique du solide',
                                        'Électronique analogique',
                                        'Structures de données',
                                        'Techniques de communication',
                                    ],
                                },
                                {
                                    name: 'S4',
                                    modules: [
                                        'Analyse numérique',
                                        'Équations différentielles',
                                        'Électronique numérique',
                                        'Systèmes logiques',
                                        'Programmation orientée objet',
                                        'Développement personnel',
                                    ],
                                },
                            ],
                        },
                    ],
                },

                // ============================================
                // CYCLE D'INGÉNIEUR (3 years, 7 filières)
                // ============================================
                {
                    name: '3ème Année (1CI)',
                    cycle: 'CI',
                    filieres: [
                        {
                            code: 'GI',
                            name: 'Génie Informatique',
                            semesters: [
                                { name: 'S5', modules: ['Module GI S5-1', 'Module GI S5-2', 'Module GI S5-3'] },
                                { name: 'S6', modules: ['Module GI S6-1', 'Module GI S6-2', 'Module GI S6-3'] },
                            ],
                        },
                        {
                            code: 'GSECS',
                            name: 'Génie Système Embarqué et Cyber Security',
                            semesters: [
                                { name: 'S5', modules: ['Module GSECS S5-1', 'Module GSECS S5-2', 'Module GSECS S5-3'] },
                                { name: 'S6', modules: ['Module GSECS S6-1', 'Module GSECS S6-2', 'Module GSECS S6-3'] },
                            ],
                        },
                        {
                            code: 'GM',
                            name: 'Génie Mécatronique',
                            semesters: [
                                { name: 'S5', modules: ['Module GM S5-1', 'Module GM S5-2', 'Module GM S5-3'] },
                                { name: 'S6', modules: ['Module GM S6-1', 'Module GM S6-2', 'Module GM S6-3'] },
                            ],
                        },
                        {
                            code: 'GC',
                            name: 'Génie Civil',
                            semesters: [
                                { name: 'S5', modules: ['Module GC S5-1', 'Module GC S5-2', 'Module GC S5-3'] },
                                { name: 'S6', modules: ['Module GC S6-1', 'Module GC S6-2', 'Module GC S6-3'] },
                            ],
                        },
                        {
                            code: 'SCM',
                            name: 'Supply Chain Management',
                            semesters: [
                                { name: 'S5', modules: ['Module SCM S5-1', 'Module SCM S5-2', 'Module SCM S5-3'] },
                                { name: 'S6', modules: ['Module SCM S6-1', 'Module SCM S6-2', 'Module SCM S6-3'] },
                            ],
                        },
                        {
                            code: 'BDIA',
                            name: 'Big Data et Intelligence Artificielle',
                            semesters: [
                                { name: 'S5', modules: ['Module BDIA S5-1', 'Module BDIA S5-2', 'Module BDIA S5-3'] },
                                { name: 'S6', modules: ['Module BDIA S6-1', 'Module BDIA S6-2', 'Module BDIA S6-3'] },
                            ],
                        },
                        {
                            code: 'GSTR',
                            name: 'Génie des Systèmes de Télécommunications et Réseaux',
                            semesters: [
                                { name: 'S5', modules: ['Module GSTR S5-1', 'Module GSTR S5-2', 'Module GSTR S5-3'] },
                                { name: 'S6', modules: ['Module GSTR S6-1', 'Module GSTR S6-2', 'Module GSTR S6-3'] },
                            ],
                        },
                    ],
                },
                {
                    name: '4ème Année (2CI)',
                    cycle: 'CI',
                    filieres: [
                        {
                            code: 'GI',
                            name: 'Génie Informatique',
                            semesters: [
                                { name: 'S7', modules: ['Module GI S7-1', 'Module GI S7-2', 'Module GI S7-3'] },
                                { name: 'S8', modules: ['Module GI S8-1', 'Module GI S8-2', 'Module GI S8-3'] },
                            ],
                        },
                        {
                            code: 'GSECS',
                            name: 'Génie Système Embarqué et Cyber Security',
                            semesters: [
                                { name: 'S7', modules: ['Module GSECS S7-1', 'Module GSECS S7-2', 'Module GSECS S7-3'] },
                                { name: 'S8', modules: ['Module GSECS S8-1', 'Module GSECS S8-2', 'Module GSECS S8-3'] },
                            ],
                        },
                        {
                            code: 'GM',
                            name: 'Génie Mécatronique',
                            semesters: [
                                { name: 'S7', modules: ['Module GM S7-1', 'Module GM S7-2', 'Module GM S7-3'] },
                                { name: 'S8', modules: ['Module GM S8-1', 'Module GM S8-2', 'Module GM S8-3'] },
                            ],
                        },
                        {
                            code: 'GC',
                            name: 'Génie Civil',
                            semesters: [
                                { name: 'S7', modules: ['Module GC S7-1', 'Module GC S7-2', 'Module GC S7-3'] },
                                { name: 'S8', modules: ['Module GC S8-1', 'Module GC S8-2', 'Module GC S8-3'] },
                            ],
                        },
                        {
                            code: 'SCM',
                            name: 'Supply Chain Management',
                            semesters: [
                                { name: 'S7', modules: ['Module SCM S7-1', 'Module SCM S7-2', 'Module SCM S7-3'] },
                                { name: 'S8', modules: ['Module SCM S8-1', 'Module SCM S8-2', 'Module SCM S8-3'] },
                            ],
                        },
                        {
                            code: 'BDIA',
                            name: 'Big Data et Intelligence Artificielle',
                            semesters: [
                                { name: 'S7', modules: ['Module BDIA S7-1', 'Module BDIA S7-2', 'Module BDIA S7-3'] },
                                { name: 'S8', modules: ['Module BDIA S8-1', 'Module BDIA S8-2', 'Module BDIA S8-3'] },
                            ],
                        },
                        {
                            code: 'GSTR',
                            name: 'Génie des Systèmes de Télécommunications et Réseaux',
                            semesters: [
                                { name: 'S7', modules: ['Module GSTR S7-1', 'Module GSTR S7-2', 'Module GSTR S7-3'] },
                                { name: 'S8', modules: ['Module GSTR S8-1', 'Module GSTR S8-2', 'Module GSTR S8-3'] },
                            ],
                        },
                    ],
                },
                {
                    name: '5ème Année (3CI)',
                    cycle: 'CI',
                    filieres: [
                        {
                            code: 'GI',
                            name: 'Génie Informatique',
                            semesters: [
                                { name: 'S9', modules: ['Module GI S9-1', 'Module GI S9-2', 'Module GI S9-3'] },
                                { name: 'S10', modules: ['Module GI S10-1', 'Module GI S10-2', 'Module GI S10-3'] },
                            ],
                        },
                        {
                            code: 'GSECS',
                            name: 'Génie Système Embarqué et Cyber Security',
                            semesters: [
                                { name: 'S9', modules: ['Module GSECS S9-1', 'Module GSECS S9-2', 'Module GSECS S9-3'] },
                                { name: 'S10', modules: ['Module GSECS S10-1', 'Module GSECS S10-2', 'Module GSECS S10-3'] },
                            ],
                        },
                        {
                            code: 'GM',
                            name: 'Génie Mécatronique',
                            semesters: [
                                { name: 'S9', modules: ['Module GM S9-1', 'Module GM S9-2', 'Module GM S9-3'] },
                                { name: 'S10', modules: ['Module GM S10-1', 'Module GM S10-2', 'Module GM S10-3'] },
                            ],
                        },
                        {
                            code: 'GC',
                            name: 'Génie Civil',
                            semesters: [
                                { name: 'S9', modules: ['Module GC S9-1', 'Module GC S9-2', 'Module GC S9-3'] },
                                { name: 'S10', modules: ['Module GC S10-1', 'Module GC S10-2', 'Module GC S10-3'] },
                            ],
                        },
                        {
                            code: 'SCM',
                            name: 'Supply Chain Management',
                            semesters: [
                                { name: 'S9', modules: ['Module SCM S9-1', 'Module SCM S9-2', 'Module SCM S9-3'] },
                                { name: 'S10', modules: ['Module SCM S10-1', 'Module SCM S10-2', 'Module SCM S10-3'] },
                            ],
                        },
                        {
                            code: 'BDIA',
                            name: 'Big Data et Intelligence Artificielle',
                            semesters: [
                                { name: 'S9', modules: ['Module BDIA S9-1', 'Module BDIA S9-2', 'Module BDIA S9-3'] },
                                { name: 'S10', modules: ['Module BDIA S10-1', 'Module BDIA S10-2', 'Module BDIA S10-3'] },
                            ],
                        },
                        {
                            code: 'GSTR',
                            name: 'Génie des Systèmes de Télécommunications et Réseaux',
                            semesters: [
                                { name: 'S9', modules: ['Module GSTR S9-1', 'Module GSTR S9-2', 'Module GSTR S9-3'] },
                                { name: 'S10', modules: ['Module GSTR S10-1', 'Module GSTR S10-2', 'Module GSTR S10-3'] },
                            ],
                        },
                    ],
                },
            ],
        });
        logger.success('✅ ENSA academic structure created successfully!');

        logger.success('🎉 Database seeding completed successfully!');
        process.exit(0);
    } catch (error: any) {
        logger.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
};

seedDatabase();
