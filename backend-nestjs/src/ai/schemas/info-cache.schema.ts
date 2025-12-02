import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InfoCacheDocument = InfoCache & Document;

@Schema({ timestamps: true, collection: 'info_cache' })
export class InfoCache {
    @Prop({ required: true, unique: true })
    key: string;

    @Prop({ required: true })
    content: string;

    @Prop({ required: true, type: Date, expires: 0 })
    expiresAt: Date;
}

export const InfoCacheSchema = SchemaFactory.createForClass(InfoCache);
