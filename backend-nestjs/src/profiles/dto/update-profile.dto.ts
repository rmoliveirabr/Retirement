import { PartialType } from '@nestjs/mapped-types';
import { ProfileBaseDto } from './profile-base.dto';

export class UpdateProfileDto extends PartialType(ProfileBaseDto) { }
