export type Group = {
  id: string;
  name: string;
  memberCount: number;
};

export type GroupListResp = {
  items: Group[];
  total: number;
};
