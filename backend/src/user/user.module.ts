import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { JwtAuthGuard } from './jwtAuthGuard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // find out: do i have to make the module globally avilable
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UserService, JwtAuthGuard, JwtStrategy],
  controllers: [UserController],
  exports: [JwtAuthGuard],
})
export class UserModule {}
