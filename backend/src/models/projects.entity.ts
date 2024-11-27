import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity'; // Assuming you have a User entity

@Entity('projects')
export class Projects {
  @PrimaryGeneratedColumn() // auto generates the id field
  id: number;

  @Column()
  user_id: string;

  @Column()
  name: string;

  // many to one mean , many project can belong to one user
  // here user property is decorated with @manytoone
  // @ManyToOne(() => User, (user) => user.projects)
  // user: User;
}
