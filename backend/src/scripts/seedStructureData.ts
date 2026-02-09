import type { ICycle } from '../models/AcademicStructure.model';

/**
 * Academic structure data (from former module_par_filière.json).
 * Cycle → Year (code) → Semester → Modules.
 */
export const STRUCTURE_CYCLES: ICycle[] = [
    {
        name: 'Cycle Préparatoire',
        cycle: 'CP',
        years: [
            {
                code: '2AP1',
                semesters: [
                    {
                        name: 'S1',
                        modules: [
                            'Analyse 1',
                            'Algèbre 1',
                            'Electrostatique et Magnétostatique',
                            'Mécanique du point matériel',
                            'Dessin Technique',
                            'Méthodologie du travail universitaire (MTU)',
                            'Langues et TEC',
                        ],
                    },
                    {
                        name: 'S2',
                        modules: [
                            'Analyse 2',
                            'Algèbre 2',
                            'Algorithmique',
                            'Chimie Générale',
                            'Thermodynamique et Statique des Fluides',
                            'Culture digitale',
                            'Language et Communication 2',
                        ],
                    },
                ],
            },
            {
                code: '2AP2',
                semesters: [
                    {
                        name: 'S3',
                        modules: [
                            'Langage C',
                            'Analyse 3',
                            'Mécanique du solide',
                            'Algèbre 3',
                            'Electrocinétique',
                            'Analyse numérique',
                        ],
                    },
                    {
                        name: 'S4',
                        modules: [
                            'Management',
                            'Optique Géométrique et Optique Physique',
                            'Electronique Analogique',
                            'Statistique et Probabilités',
                            'Électromagnétisme et Physique des ondes',
                            'Analyse 4',
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Génie Informatique',
        cycle: 'CI',
        years: [
            {
                code: 'GI1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Théorie des Graphes et Recherche Opérationnel',
                            'Architecture des Ordinateurs & Assembleur',
                            'Base des Donnees Relationnelles',
                            'Réseaux Informatiques',
                            'Structure de Données en C',
                            'Langues étrangères 1',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Digital Skills',
                            "Systèmes d'Exploitation et Linux",
                            'Modelisation Orientée Objet',
                            'Théories des Langages et Compilation',
                            'Développement Web',
                            'Programmation Orientée Objet Java',
                            'Langues étrangères 2',
                            'Culture & Arts & Sport Skills',
                        ],
                    },
                ],
            },
            {
                code: 'GI2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Administration des Bases de Donnees Relationnelles',
                            'Developpement Web Avance',
                            'Reseaux Informatiques Avances',
                            'Méthodologies et Génie Logiciel',
                            'Technologie DotNet',
                            'Langues etrangères 3',
                            'Proprieté Intellectuelle',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            'Machine Learning',
                            'Administration Systèmes, Services et Sécurité Réseaux',
                            'Sécurité Informatique',
                            'Java Entreprise Edition',
                            'Microservices et Developpement Mobile',
                            'Langues étrangères 4',
                            'Gestion de projet et entreprise',
                        ],
                    },
                ],
            },
            {
                code: 'GI3',
                semesters: [
                    {
                        name: "S9 - Systemes d'Information et d'Aide à la Décision",
                        modules: [
                            'Frameworks Technologie Web',
                            'Big Data & Analytics',
                            "Systèmes de Planification des Ressources d'Entreprise (ERP)",
                            "Urbanisme des Systemes d'Information",
                            'Deep Learning',
                            'Langues étrangères 5',
                            'Employment skills',
                        ],
                    },
                    {
                        name: 'S9 - Génie Logiciel',
                        modules: [
                            'Frameworks Technologie Web',
                            'Big Data & Analytics',
                            "Systèmes de Planification des Ressources d'Entreprise (ERP)",
                            'Gestion et Maintenance des Systèmes Logiciel',
                            'Technologies Émergentes',
                            'Langues étrangères 5',
                            'Employment skills',
                        ],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Génie des Systèmes de Télécommunications et Réseaux',
        cycle: 'CI',
        years: [
            {
                code: 'GSTR1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Electronique Numérique',
                            'Réseaux Informatiques',
                            'Traitement Numérique Du Signal',
                            'Concepts fondamentaux Du Machine Learning',
                            'Bases De Données Relationnelles',
                            'Power Skills',
                            'Langues étrangères 1',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Electronique analogique pour les télécommunications',
                            'Modulation numérique',
                            'Conception des circuits VLSI',
                            'Apprentissage Automatique et Applications',
                            'Modélisation et programmation orientées objet',
                            'Langues étrangères 2',
                            'Culture & arts & sport skills',
                        ],
                    },
                ],
            },
            {
                code: 'GSTR2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Technologies de Réseaux Mobiles',
                            "Traitement numérique d'image et vision par ordinateur",
                            "Apprentissage profond",
                            "Réseaux informatiques avancés",
                            'Administration des Bases de Données Relationnelles',
                            'Langues étrangères 3',
                            'Power Skills : IA et éthiques',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            "Internet des objets (IOT) & applications",
                            'Systèmes embarqués temps réel',
                            'Codage : théorie et applications',
                            'Systèmes de Communications Numériques',
                            'Sécurité des Systèmes Informatiques',
                            'LANGUES ETRANGERES 4',
                            'GESTION DE PROJET ET ENTREPRISE',
                        ],
                    },
                ],
            },
            {
                code: 'GSTR3',
                semesters: [
                    {
                        name: 'S9 - Cybersécurité et Systèmes Embarqués',
                        modules: [
                            'Réseaux mobiles de nouvelle génération',
                            'Systèmes satellitaires : Télédétection et Télécommunication',
                            'Communication et réseau sur fibres optiques',
                            'Cybersécurité et sécurité des réseaux',
                            'Cryptographie Appliquée et Sécurité des Protocoles',
                            'LANGUES ETRANGERES 5',
                            'Employment skills',
                        ],
                    },
                    {
                        name: 'S9 - Systèmes de Télécommunication et Réseaux',
                        modules: [
                            'Cybersécurité des Systèmes Embarqués',
                            'Cybersécurité et sécurité des réseaux',
                            'Cryptographie Appliquée et Sécurité des Protocoles',
                            'Virtualisation et Cloud Computing',
                            'Contrôle commande embarqué',
                            'LANGUES ETRANGERES 5',
                            'Employment skills',
                        ],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Supply Chain Management',
        cycle: 'CI',
        years: [
            {
                code: 'SCM1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Base de données relationnelles',
                            'Statistique inférentielle et calcul stochastique',
                            'Théorie des graphes et recherche operationnelle',
                            "Gestion de la production",
                            'Théorie des organisation et IT management',
                            'Langues étrangère 1 (Français, Espagnole)',
                            'Digital skills',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Modélisation et programmation orienté objet',
                            'Culture & art & sport skills',
                            "Apprentissage automatique",
                            'Optimisation combinatoire',
                            'Langue étrangère 2 (Français, Anglais)',
                            'Management de la qualité',
                            'Techniques d\'achat et de réduction des coûts',
                        ],
                    },
                ],
            },
            {
                code: 'SCM2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Planification et ordonnancement de la production',
                            'Management de la chaîne logistique',
                            'Entreposage et gestion des stocks',
                            'Simulation des systèmes industriels',
                            'Sûreté de fonctionnement et gestion de la maintenance',
                            'Intelligence artificielle',
                            'Langues étrangères 3 (Français, Espagnole)',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            'Langues étrangères 4 (Anglais, espagnole)',
                            'Modélisation et évaluation des performances des systèmes industriels',
                            'Analyse des données et data mining',
                            'Analyse fonctionnelle et analyse de la valeur',
                            'Gestion de projet et entreprise',
                            'Supply chain finance',
                            'Logistique portuaire et commerce international',
                        ],
                    },
                ],
            },
            {
                code: 'SCM3',
                semesters: [
                    {
                        name: 'S9 - Logistique et Transport',
                        modules: [
                            'Excellence industrielle',
                            'Langue étrangère 5 (Anglais, Espagnole)',
                            'Logistique de distribution et transport',
                            'Apprentissage profond',
                            'Entreprenariat et création d\'entreprise',
                            'Système d\'information en SCM',
                            'Employment skills',
                        ],
                    },
                    {
                        name: 'S9 - Ingénierie Automobile',
                        modules: [
                            'Excellence industrielle',
                            'Langue étrangère 5 (Anglais, Espagnole)',
                            'Système d\'information en SCM',
                            'Employment skills',
                            'Sécurité et performance dans l\'industrie Automobile',
                            'Fondamentaux et technologies avancées de l\'industrie Automobile',
                            'Industrie 4.0',
                        ],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Génie Système Embarqué et Cyber Security',
        cycle: 'CI',
        years: [
            {
                code: 'GSECS1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Réseaux Informatiques',
                            'Analyse et Traitement du Signal',
                            'Systèmes Numériques',
                            'Systèmes Informatiques : Systèmes Open Source et Windows',
                            'Programmation Orientée Objet : Java et Python',
                            'L1 : Espagnol L2 : Français',
                            'Digital Skills: Compétences Numériques',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Informatique Industrielle',
                            'Réseaux Avancés : Routage et Commutation',
                            'Introduction à la Sécurité des Systèmes Embarqués',
                            'Architectures et Programmation DSP',
                            'Architecture des Systèmes Embarqués',
                            'L1 : Anglais L2 : Français',
                            'Culture & Arts & Sport Skills',
                        ],
                    },
                ],
            },
            {
                code: 'GSECS2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Administration Systèmes et Réseaux',
                            'Capteurs & Instrumentation Initiale',
                            'Programmation des Circuits FPGA',
                            'Technologies IoT: Architectes, Protocoles et Applications',
                            'L1 : Espagnol L2 : Français',
                            'Introduction à l\'Intelligence Artificielle',
                            'Propriété Intellectuelle',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            'Virtualisation, Cloud et Edge Computing',
                            'Fondamentaux et Application de l\'IA',
                            'Cryptographie et Sécurité des Services',
                            'Cybersecurity & Ethical Hacking',
                            'Technologies des Réseaux Mobiles',
                            'L1 : Espagnol L2 : Anglais',
                            'Gestion de Projet et Entreprise',
                        ],
                    },
                ],
            },
            {
                code: 'GSECS3',
                semesters: [
                    {
                        name: 'S9',
                        modules: [
                            'Audit des Systèmes d\'Information et Management de la Sécurité des Systèmes d\'Information',
                            'Gestion de l\'Innovation et Management de Projet Informatique',
                            'Les Stratégies de Gestion des Risques',
                            'Sécurité d\'une Infrastructure Digitale',
                            'Conception des Systèmes Embarqués Avancés',
                            'L1 : Espagnol L2 : Anglais',
                            'Employment Skills',
                        ],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Génie Mécanique',
        cycle: 'CI',
        years: [
            {
                code: 'GM1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Probabilités et calcul stochastique',
                            'Traitement de signal',
                            'Réseaux électriques et informatiques',
                            'Électronique',
                            'Base des données relationnelles',
                            'Langues et Communication',
                            'Gestion de projet et entreprise',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Énergétique et mécanique des fluides',
                            'Mécanique',
                            'Automatique',
                            'Résistance des Matériaux',
                            'Modélisation et Programmation Orientée Objet',
                            'Soft skills',
                            'Langues et Communication',
                        ],
                    },
                ],
            },
            {
                code: 'GM2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Théorie des mécanismes et robotique',
                            'Productique',
                            'Électronique de puissance et électrotechnique',
                            'Automatique et électronique',
                            'Mathématiques et méthodes numériques',
                            'Langues et Communication',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            'Conception des machines et CAO',
                            'Automatisme et capteurs',
                            'Management',
                            'Microcontrôleur',
                            'Technologie automobile',
                            'Actionneurs industriels',
                            'Langues et Communication',
                        ],
                    },
                ],
            },
            {
                code: 'GM3',
                semesters: [
                    {
                        name: 'S9',
                        modules: ['Module GM S9-1', 'Module GM S9-2', 'Module GM S9-3'],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Big Data et Intelligence Artificielle',
        cycle: 'CI',
        years: [
            {
                code: 'BDIA1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Analyse et fouille de données',
                            'Gestion de projet et entreprise 1',
                            'Génie logiciel',
                            'Statistiques',
                            'Systèmes d\'exploitation: Introduction a Linux',
                            'Fondamentaux des bases de données',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Algorithmique avancée et programmation',
                            'Apprentissage Automatique',
                            'Visualisation des données',
                            'Fondamentaux du Big Data',
                            'Algèbre linéaire numérique pour l\'analyse de données',
                        ],
                    },
                ],
            },
            {
                code: 'BDIA2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Informatique décisionnelle',
                            'Apprentissage profond',
                            'Ingénierie des bases des données',
                            'Systèmes d\'exploitation avancés',
                            'Sécurité',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            'Théorie de l\'information',
                            'Ethique et droit',
                            'Les techniques de veille',
                            'Fondamentaux et Applications de l\'intelligence artificielle',
                            'Analyse du web',
                        ],
                    },
                ],
            },
            {
                code: 'BDIA3',
                semesters: [
                    {
                        name: 'S9',
                        modules: ['Module BDIA S9-1', 'Module BDIA S9-2', 'Module BDIA S9-3'],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
    {
        name: 'Cycle Ingénieur - Génie Civil',
        cycle: 'CI',
        years: [
            {
                code: 'GC1',
                semesters: [
                    {
                        name: 'S5',
                        modules: [
                            'Résistance des matériaux 1',
                            'Sciences des matériaux',
                            'Mécanique des solides déformables',
                            'Lecture des plans et métrés',
                            'Gestion des projets et entreprises',
                            'Méthode numérique pour le génie civil',
                            'Langue et communication',
                        ],
                    },
                    {
                        name: 'S6',
                        modules: [
                            'Topographie et urbanisme',
                            'Géotechnique',
                            'Mécanique des fluides',
                            'Résistance des matériaux 2',
                            'Géologie',
                            'Langue et communication',
                            'Digital skills',
                        ],
                    },
                ],
            },
            {
                code: 'GC2',
                semesters: [
                    {
                        name: 'S7',
                        modules: [
                            'Résistance des matériaux 3',
                            'Mécanique des sols',
                            'Hydrologie',
                            'Matériaux de construction',
                            'Les routes',
                            'Langue et communication',
                            'Propriétés intellectuelles',
                        ],
                    },
                    {
                        name: 'S8',
                        modules: [
                            'Charpente métallique',
                            'Béton armé',
                            'Géotechnique 2',
                            'Calcul des structures',
                            'Gestion des entreprises',
                            'Langues et communication',
                            'Assainissement et VRD',
                        ],
                    },
                ],
            },
            {
                code: 'GC3',
                semesters: [
                    {
                        name: 'S9',
                        modules: ['Module GC S9-1', 'Module GC S9-2', 'Module GC S9-3'],
                    },
                    { name: 'S10', modules: ['Stage PFE'] },
                ],
            },
        ],
    },
];
