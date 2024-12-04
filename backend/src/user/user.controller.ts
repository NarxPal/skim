import {
  UseGuards,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Response,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/models/user.entity';
import { JwtAuthGuard } from './jwtAuthGuard';
import { CreateUserDto } from './userDTO';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signUp(
    @Body() userData: CreateUserDto,
  ): Promise<{ user: User; accessToken: string }> {
    return this.userService.signUp(userData);
  }

  // User SignIn - Returns JWT Token
  @Post('signin')
  async signIn(
    @Response() res,
    @Body() signInDto: { email: string; password: string },
  ) {
    const data = await this.userService.signIn(
      signInDto.email,
      signInDto.password,
    );

    return res.send({
      accessToken: data.accessToken,
      message: 'logged in',
      user: data.user,
    });
  }

  // Get All Users (Only accessible with JWT)
  @Get()
  @UseGuards(JwtAuthGuard) //  this router will require jwt token to access it
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  // Get User by ID (Only accessible with JWT)
  // this get req is for fetching user with id param (/user/id)
  // this is for the editor andproject main page
  @Get(':user_id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('user_id') user_id: string): Promise<User> {
    return this.userService.findOne(user_id);
  }
}
