import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../user/jwtAuthGuard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard) // Protect this route with JWT
  getProtectedData(@Request() req) {
    return { message: 'This is protected data', userId: req.user.userId };
  }
}
