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
  // later: not having here column_id since don't know how we will pass it in frontend from handlemediadrop to createsubcol
};

export type Gap = {
  id: number;
  sub_col_id: number;
  barId: number;
  start_gap: number;
  end_gap: number;
  width: number;
};

export type Sub_Column = {
  id: number;
  sub_col_id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
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
  bars?: Bar[];
  gaps?: Gap[];
}

// this BarData is for subColumn bars, so here we don't have column_id
export class BarData {
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
}
