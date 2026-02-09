import mongoose, { Document, Schema } from 'mongoose';

export interface ISemester {
    name: string;
    modules: string[];
}

export interface IYearLevel {
    code: string; // "2AP1", "GI1", "GSTR1", etc.
    semesters: ISemester[];
}

export interface ICycle {
    name: string; // "Cycle Préparatoire", "Cycle Ingénieur - Génie Informatique"
    cycle: 'CP' | 'CI'; // CP = Cycle Préparatoire, CI = Cycle Ingénieur
    years: IYearLevel[];
}

export interface IAcademicStructure extends Document {
    cycles: ICycle[];
    updatedAt: Date;
}

const semesterSchema = new Schema(
    {
        name: { type: String, required: true },
        modules: [{ type: String, required: true }],
    },
    { _id: false }
);

const yearLevelSchema = new Schema(
    {
        code: { type: String, required: true },
        semesters: [semesterSchema],
    },
    { _id: false }
);

const cycleSchema = new Schema(
    {
        name: { type: String, required: true },
        cycle: { type: String, required: true, enum: ['CP', 'CI'] },
        years: [yearLevelSchema],
    },
    { _id: false }
);

const academicStructureSchema = new Schema<IAcademicStructure>(
    {
        cycles: [cycleSchema],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IAcademicStructure>(
    'AcademicStructure',
    academicStructureSchema
);
