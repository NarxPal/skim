import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/models/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get() // http req
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post()
  async create(
    @Body()
    userData: {
      id: number;
      user_id: string;
      username: string;
      email: string;
      password: string;
    },
  ): Promise<User> {
    return this.userService.create(userData);
  }

  // this get req is for fetching user with id param (/user/id)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id);
  }
}
