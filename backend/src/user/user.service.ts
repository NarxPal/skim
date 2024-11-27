import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/models/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async create(userData: {
    id: number;
    user_id: string;
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10); // 10 is the salt rounds
    const user = this.userRepository.create({
      id: userData.id,
      user_id: userData.user_id,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  // async validatePassword(username: string, password: string): Promise<boolean> {
  //   const user = await this.userRepository.findOne({ where: { username } });
  //   if (user && bcrypt.compareSync(password, user.password)) {
  //     return true;
  //   }
  //   return false;
  // }

  findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }
}
