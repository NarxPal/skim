export type bar = {
  filepath: string;
  id: number;
  left_position: number;
  name: string;
  project_id: number;
  signedUrl: string;
  type: string;
  user_id: string;
  width: number;
  duration: number;
};

export type sub_column = {
  id: number;
  parent_id: number;
  project_id: number;
  user_id: string;
  bars: bar[];
};
export type BarsProp = {
  id: number;
  parent_id: number;
  project_id: number;
  user_id: string;
  sub_columns: sub_column[];
};
