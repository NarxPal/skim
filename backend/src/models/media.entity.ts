import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('media_files')
export class Media {
  @PrimaryGeneratedColumn() // auto generates the id field
  id: number;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  user_id: string;

  @Column()
  project_id: number;

  @Column()
  name: string;

  @Column()
  filepath: string;

  @Column()
  type: string;

  // many to one mean , many project can belong to one user
  // here user property is decorated with @manytoone
  // @ManyToOne(() => User, (user) => user.projects)
  // user: User;
}
