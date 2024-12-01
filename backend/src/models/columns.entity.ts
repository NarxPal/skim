import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('columns')
export class Columns {
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
  position: number; // rather than position here we need to take array of column , to know how much column does each project carry , by default 3 cols will be shown

  @Column({ type: 'simple-array', default: '1,2,3' })
  columns: number[];

  // many to one mean , many project can belong to one user
  // here user property is decorated with @manytoone
  // @ManyToOne(() => User, (user) => user.projects)
  // user: User;
}
