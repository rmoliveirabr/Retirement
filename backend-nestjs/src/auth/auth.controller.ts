import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
    Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from './schemas/user.schema';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('request-password-reset')
    @HttpCode(HttpStatus.OK)
    async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
        return this.authService.requestPasswordReset(requestDto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetDto: ResetPasswordDto) {
        const { token, newPassword } = resetDto;
        // Extract email from token or require it in the body
        // For simplicity, we'll require email in the body
        return { message: 'Please provide email in the request' };
    }

    @Post('reset-password/:email')
    @HttpCode(HttpStatus.OK)
    async resetPasswordWithEmail(
        @Param('email') email: string,
        @Body() resetDto: ResetPasswordDto,
    ) {
        return this.authService.resetPassword(email, resetDto.token, resetDto.newPassword);
    }

    @Post('admin/reset-password')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async adminResetPassword(
        @CurrentUser() user: any,
        @Body() body: { email: string },
    ) {
        return this.authService.adminResetPassword(user.userId, body.email);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getCurrentUser(@CurrentUser() user: any) {
        return this.authService.getUserById(user.userId);
    }

    @Get('users')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAllUsers() {
        return this.authService.getAllUsers();
    }
}
