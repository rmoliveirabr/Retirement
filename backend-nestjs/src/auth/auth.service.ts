import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, role } = registerDto;

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = new this.userModel({
            email: email.toLowerCase(),
            passwordHash,
            role: role || UserRole.USER,
        });

        await user.save();

        // Generate JWT token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    async requestPasswordReset(email: string): Promise<{ resetToken: string; resetLink: string }> {
        const user = await this.userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if user exists or not for security
            throw new NotFoundException('If a user with this email exists, a password reset link has been sent');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt.hash(resetToken, 10);

        // Set token and expiration (1 hour)
        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // In production, you would send this via email
        // For now, we'll return it in the response
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

        return { resetToken, resetLink };
    }

    async resetPassword(email: string, token: string, newPassword: string) {
        const user = await this.userModel.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        // Check if token is expired
        if (user.passwordResetExpires < new Date()) {
            throw new BadRequestException('Reset token has expired');
        }

        // Verify token
        const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);
        if (!isTokenValid) {
            throw new BadRequestException('Invalid reset token');
        }

        // Hash new password
        const saltRounds = 10;
        user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return { message: 'Password reset successful' };
    }

    async adminResetPassword(adminUserId: string, targetEmail: string): Promise<{ resetToken: string; resetLink: string }> {
        // Verify admin user
        const adminUser = await this.userModel.findById(adminUserId);
        if (!adminUser || adminUser.role !== UserRole.ADMIN) {
            throw new UnauthorizedException('Only admins can reset passwords');
        }

        // Find target user
        const targetUser = await this.userModel.findOne({ email: targetEmail.toLowerCase() });
        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt.hash(resetToken, 10);

        // Set token and expiration (24 hours for admin resets)
        targetUser.passwordResetToken = resetTokenHash;
        targetUser.passwordResetExpires = new Date(Date.now() + 86400000); // 24 hours
        await targetUser.save();

        // Generate reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${targetEmail}`;

        return { resetToken, resetLink };
    }

    async validateUser(userId: string): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }

    private generateToken(user: UserDocument): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }

    async getAllUsers() {
        return this.userModel.find().select('-passwordHash').exec();
    }

    async getUserById(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}
