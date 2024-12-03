import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  isNotEmpty,
} from 'class-validator';

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
