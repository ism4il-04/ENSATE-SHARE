import mongoose, { Document, Schema } from 'mongoose';

interface IModule {
    name: string;
}

interface IFiliere {
    name: string;
    modules: string[];
}

interface IYear {
    name: string;
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
                filieres: [
                    {
                        name: {
                            type: String,
                            required: true,
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
    {
        timestamps: true,
    }
);

export default mongoose.model<IAcademicStructure>(
    'AcademicStructure',
    academicStructureSchema
);
