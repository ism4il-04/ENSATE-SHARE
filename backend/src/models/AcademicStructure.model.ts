import mongoose, { Document, Schema } from 'mongoose';

interface ISemester {
    name: string; // "S1" or "S2"
    modules: string[];
}

interface IFiliere {
    code: string; // "2AP", "GI", "GSECS", etc.
    name: string;
    semesters: ISemester[];
}

interface IYear {
    name: string; // "1ère Année", "2ème Année", etc.
    cycle: string; // "CP" (Cycle Préparatoire) or "CI" (Cycle d'Ingénieur)
    filieres: IFiliere[];
}

export interface IAcademicStructure extends Document {
    years: IYear[];
    updatedAt: Date;
}

const academicStructureSchema = new Schema<IAcademicStructure>(
    {
        years: [
            {
                name: {
                    type: String,
                    required: true,
                },
                cycle: {
                    type: String,
                    required: true,
                    enum: ['CP', 'CI'],
                },
                filieres: [
                    {
                        code: {
                            type: String,
                            required: true,
                        },
                        name: {
                            type: String,
                            required: true,
                        },
                        semesters: [
                            {
                                name: {
                                    type: String,
                                    required: true,
                                    enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'],
                                },
                                modules: [
                                    {
                                        type: String,
                                        required: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IAcademicStructure>(
    'AcademicStructure',
    academicStructureSchema
);
