import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true })
export class Profile {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ required: true })
    profileName: string;

    @Prop({ required: true })
    baseAge: number;

    @Prop()
    startDate?: string;

    @Prop({ required: true, default: 0 })
    totalAssets: number;

    @Prop({ required: true, default: 0 })
    fixedAssets: number;

    @Prop({ required: true, default: 0 })
    monthlySalaryNet: number;

    @Prop({ required: true, default: 0 })
    governmentRetirementIncome: number;

    @Prop({ required: true, default: 0 })
    monthlyReturnRate: number;

    @Prop({ required: true, default: 0.04 })
    fixedAssetsGrowthRate: number;

    @Prop({ required: true, default: 0 })
    investmentTaxRate: number;

    @Prop({ required: true, default: 1.0 })
    investmentTaxablePercentage: number;

    @Prop()
    endOfSalaryYears?: string;

    @Prop()
    governmentRetirementStartYears?: string;

    @Prop({ required: true, default: 0 })
    governmentRetirementAdjustment: number;

    @Prop({ required: true, default: 0 })
    monthlyExpenseRecurring: number;

    @Prop({ required: true, default: 0 })
    oneTimeAnnualExpense: number;

    @Prop({ required: true, default: 0 })
    annualInflation: number;

    @Prop()
    lastCalculation?: Date;

    createdAt: Date;
    updatedAt: Date;
    id: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Add a virtual 'id' property
ProfileSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
ProfileSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});
