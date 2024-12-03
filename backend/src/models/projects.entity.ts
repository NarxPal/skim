import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity'; // Assuming you have a User entity
import { Columns } from './columns.entity';

@Entity('projects')
export class Projects {
  @PrimaryGeneratedColumn() // auto generates the id field
  id: number;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  user_id: string;

  @Column()
  name: string;

  // // column data will be shows in here
  // @OneToOne(() => Columns, (column) => column.project)
  // @JoinColumn() // Automatically links with project_id in Columns
  // column: Columns; // A single column per project

  // many to one mean , many project can belong to one user
  // here user property is decorated with @manytoone
  // @ManyToOne(() => User, (user) => user.projects)
  // user: User;
}
