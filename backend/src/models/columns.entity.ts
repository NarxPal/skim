import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

type Bar = {
  id: number;
  sub_col_id: number;
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
  duration: number;
  clip_duration: number;
  ruler_start_time: number;
  ruler_start_time_in_sec: number;
  volume: number;
};

type Gap = {
  id: number;
  sub_col_id: number;
  barId: number;
  start_gap: number;
  end_gap: number;
  width: number;
  media_type: string;
};

type Sub_Column = {
  id: number;
  sub_col_id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
  media_type: string;
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
}
