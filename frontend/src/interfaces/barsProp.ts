export type bar = {
  filepath: string;
  id: number;
  left_position: number;
  name: string;
  project_id: number;
  type: string;
  user_id: string;
  width: number;
  duration: number;
  order: number;
  url: string;
  thumbnail_url: string;
  start_time: number;
  end_time: number;
};

export type gap = {
  id: number;
  barId: number;
  start_gap: number;
  end_gap: number;
  width: number;
};

export type sub_column = {
  id: number;
  parent_id: number;
  project_id: number;
  user_id: string;
  bars: bar[];
  gaps: gap[];
};
export type BarsProp = {
  id: number;
  parent_id: number;
  project_id: number;
  user_id: string;
  sub_columns: sub_column[];
};
