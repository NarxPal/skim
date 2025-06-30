import { IsNotEmpty, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateColumnDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @IsNotEmpty()
  project_id: number;

  @IsNumber()
  @IsOptional()
  parent_id: number;
}

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

export type Gap = {
  id: number;
  sub_col_id: number;
  barId: number;
  start_gap: number;
  end_gap: number;
  width: number;
  media_type: string;
};

export type Sub_Column = {
  id: number;
  sub_col_id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
  media_type: string;
  bars?: Bar[];
  gaps?: Gap[];
};

export class SubColDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  user_id: string;

  @IsNotEmpty()
  project_id: number;

  @IsNotEmpty()
  parent_id: number;

  @IsNotEmpty()
  sub_columns: Sub_Column[];

  @IsNotEmpty()
  bars: Bar[];

  @IsNotEmpty()
  gaps: Gap[];
}

export class OnlySubColDto {
  id: number;
  sub_col_id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
  media_type: string;
  bars?: Bar[];
  gaps?: Gap[];
}

// this BarData is for subColumn bars, so here we don't have column_id
export class BarData {
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
}
