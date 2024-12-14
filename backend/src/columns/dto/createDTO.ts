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
  signedUrl: string;
  filepath: string;
  order: number;

  // later: not having here column_id since don't know how we will pass it in frontend from handlemediadrop to createsubcol
};

type Sub_Column = {
  id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
  bars?: Bar[];
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
}

export class OnlySubColDto {
  id: number;
  project_id: number;
  user_id: string;
  parent_id: number;
  bars?: Bar[];
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
  signedUrl: string;
  filepath: string;
  order: number;
}
