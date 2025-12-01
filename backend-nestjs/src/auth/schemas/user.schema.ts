import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ required: true, enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop()
    passwordResetToken?: string;

    @Prop()
    passwordResetExpires?: Date;

    createdAt: Date;
    updatedAt: Date;
    id: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add a virtual 'id' property
UserSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
        delete ret.passwordHash; // Never expose password hash
    },
});
