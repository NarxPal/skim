import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
// import { Projects } from './projects.entity';
// import { Expose, Transform } from 'class-transformer';

type Bar = {
  id: number;
  user_id: string;
  name: string;
  left_position: number;
  width: number;
  project_id: number;
  type: string;
  thumbnail_url: string;
  filepath: string;
  order: number;
  url: string;
  start_time: number;
  end_time: number;
};

type Gap = {
  start_gap: number;
  end_gap: number;
  width: number;
};

type Sub_Column = {
  id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
  bars?: Bar[];
  gaps?: Gap[];
};

@Entity('columns')
export class Columns {
  @PrimaryGeneratedColumn() // auto generates the id field
  id: number; // it should be unique, since bars are linked to it using column_id (see bars entitiy)

  @Column({
    type: 'uuid',
    nullable: false,
  })
  user_id: string;

  @Column()
  project_id: number; // will be connecting the column with the project id

  @Column({ nullable: true })
  parent_id: number; // this will contain the id from the root col for sub-column, for root column it will null

  @Column('json', { nullable: true })
  sub_columns: Sub_Column[];

  // // the above data will be shown in projects entity as well
  // @ManyToOne(() => Projects, (project) => project.column)
  // @JoinColumn({ name: 'id' })
  // project: Projects;
}
