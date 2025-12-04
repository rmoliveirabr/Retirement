import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/profiles')
@UseGuards(AuthGuard('jwt'))
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Get()
    findAll(@CurrentUser() user: any) {
        // Return only profiles belonging to the authenticated user
        return this.profilesService.findByUserId(user.userId);
    }

    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        const profile = await this.profilesService.findOne(id);

        // Verify ownership
        const profileUserId = profile.userId ? profile.userId.toString() : null;

        if (!profileUserId || profileUserId !== user.userId) {
            throw new HttpException('Forbidden: You can only access your own profiles', HttpStatus.FORBIDDEN);
        }
        return profile;
    }


    @Post()
    create(@Body() createProfileDto: CreateProfileDto, @CurrentUser() user: any) {
        return this.profilesService.create(createProfileDto, user.userId);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateProfileDto: UpdateProfileDto,
        @CurrentUser() user: any,
    ) {
        // Verify ownership before update
        const profile = await this.profilesService.findOne(id);

        // Handle legacy profiles or string/ObjectId mismatch
        const profileUserId = profile.userId ? profile.userId.toString() : null;

        if (!profileUserId || profileUserId !== user.userId) {
            throw new HttpException('Forbidden: You can only update your own profiles', HttpStatus.FORBIDDEN);
        }
        return this.profilesService.update(id, updateProfileDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        // Verify ownership before delete
        const profile = await this.profilesService.findOne(id);

        const profileUserId = profile.userId ? profile.userId.toString() : null;

        if (!profileUserId || profileUserId !== user.userId) {
            throw new HttpException('Forbidden: You can only delete your own profiles', HttpStatus.FORBIDDEN);
        }
        return this.profilesService.remove(id);
    }

    @Get(':id/clone')
    async clone(@Param('id') id: string, @CurrentUser() user: any) {
        // Verify ownership before clone
        const profile = await this.profilesService.findOne(id);

        const profileUserId = profile.userId ? profile.userId.toString() : null;

        if (!profileUserId || profileUserId !== user.userId) {
            throw new HttpException('Forbidden: You can only clone your own profiles', HttpStatus.FORBIDDEN);
        }
        return this.profilesService.clone(id);
    }
}
