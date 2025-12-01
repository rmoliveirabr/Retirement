import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, ProfileDocument } from './schemas/profile.schema';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    ) { }

    async findAll(): Promise<Profile[]> {
        return this.profileModel.find().exec();
    }

    async findByUserId(userId: string): Promise<Profile[]> {
        return this.profileModel.find({ userId }).exec();
    }

    async findOne(id: string): Promise<Profile> {
        // Validate if id is valid ObjectId? Mongoose throws CastError if not.
        // We can let it throw or catch it.
        try {
            const profile = await this.profileModel.findById(id).exec();
            if (!profile) {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
            return profile;
        } catch (error) {
            if (error.name === 'CastError') {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
            throw error;
        }
    }

    async findByEmail(email: string): Promise<Profile[]> {
        return this.profileModel.find({ email }).exec();
    }

    async create(createProfileDto: CreateProfileDto, userId: string): Promise<Profile> {
        const createdProfile = new this.profileModel({
            ...createProfileDto,
            userId,
        });
        return createdProfile.save();
    }

    async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
        try {
            const updatedProfile = await this.profileModel
                .findByIdAndUpdate(id, updateProfileDto, { new: true })
                .exec();

            if (!updatedProfile) {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
            return updatedProfile;
        } catch (error) {
            if (error.name === 'CastError') {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        try {
            const result = await this.profileModel.findByIdAndDelete(id).exec();
            if (!result) {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
        } catch (error) {
            if (error.name === 'CastError') {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
            throw error;
        }
    }

    async clone(id: string): Promise<Partial<Profile>> {
        const profile = await this.findOne(id);
        // Convert to object to strip mongoose properties
        const profileObj = (profile as any).toObject ? (profile as any).toObject() : profile;

        const {
            _id,
            id: _virtualId,
            email,
            createdAt,
            updatedAt,
            lastCalculation,
            __v,
            ...cloneData
        } = profileObj;

        return cloneData;
    }
}
