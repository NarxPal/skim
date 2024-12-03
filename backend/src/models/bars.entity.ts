import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Columns } from './columns.entity';

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
  name: string; // take name from media entity.ts, using name bc there could be multiple media with same id

  // @Column()
  // media_id: number;

  @Column()
  left_position: number;

  @Column()
  width: number;

  // @Column()
  // start_time: number;

  // @Column()
  // position: number;

  @Column()
  project_id: number;

  // column_id should be the id of sub_column
  @Column()
  column_id: number;
}
