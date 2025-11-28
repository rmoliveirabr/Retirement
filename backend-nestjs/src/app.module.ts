import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { RetirementModule } from './retirement/retirement.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        console.log('Trying to connect to MongoDB URI:', uri?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
        return {
          uri,
          user: configService.get<string>('MONGODB_USER'),
          pass: configService.get<string>('MONGODB_PASSWORD'),
          dbName: configService.get<string>('MONGODB_DB_NAME'),
          serverSelectionTimeoutMS: 5000,
          retryAttempts: 0,
        };
      },
      inject: [ConfigService],
    }),
    ProfilesModule,
    RetirementModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectConnection() private connection: Connection) { }

  onModuleInit() {
    this.connection.on('connected', () => {
      this.logger.log('✅ MongoDB connection successful');
    });
  }
}
