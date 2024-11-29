import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('bars')
export class Bars {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  user_id: string;

  @Column()
  column_id: number;

  @Column()
  name: string;

  @Column()
  media_id: number;

  @Column()
  left_position: number;

  @Column()
  width: number;

  @Column()
  start_time: number;

  @Column()
  position: number;

  @Column()
  project_id: number;

  // many to one mean , many project can belong to one user
  // here user property is decorated with @manytoone
  // @ManyToOne(() => User, (user) => user.projects)
  // user: User;
}
