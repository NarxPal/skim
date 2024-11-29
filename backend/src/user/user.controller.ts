import { UseGuards, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/models/user.entity';
import { JwtAuthGuard } from './jwtAuthGuard';
import { CreateUserDto } from './userDTO';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signUp(
    @Body() createUserDto: CreateUserDto, // Assume CreateUserDto has user input validation
  ): Promise<User> {
    return this.userService.signUp(createUserDto);
  }

  // User SignIn - Returns JWT Token
  @Post('signin')
  async signIn(
    @Body() signInDto: { email: string; password: string },
  ): Promise<{ accessToken: string }> {
    return this.userService.signIn(signInDto.email, signInDto.password);
  }

  // Get All Users (Only accessible with JWT)
  @Get()
  @UseGuards(JwtAuthGuard) //  this router will require jwt token to access it
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  // Get User by ID (Only accessible with JWT)
  // this get req is for fetching user with id param (/user/id)
  @Get(':user_id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('user_id') user_id: string): Promise<User> {
    return this.userService.findOne(user_id);
  }
}
