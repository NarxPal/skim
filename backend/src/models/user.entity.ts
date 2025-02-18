import { Entity, PrimaryGeneratedColumn, Column, Generated, OneToMany } from 'typeorm';
import { Projects } from './projects.entity';

@Entity({ schema: 'auth' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'uuid',
    default: () => 'uuid_generate_v4()',
    nullable: false,
  })
  user_id: string;

  @Column()
  username: string;

  @Column(
    {
      nullable: false,
      unique: true,  
    }
  )
  email: string;

  @Column()
  password: string;

  // @OneToMany(() => Projects, (project) => project.user)
  // projects: Projects[];
}
