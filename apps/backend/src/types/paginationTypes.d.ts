export type PaginationGenerateParams = {
  page?: number;
  limit?: number;
  totalItems?: number;
};

export type Pagination = {
  page: number;
  limit: number;
  totalPage: number;
  totalItems: number;
  nextPage?: number;
  prevPage?: number;
};

export type PaginationLinksParams = {
  path?: string;
  page?: number;
  totalPage?: number;
  limit?: number;
  sortType?: string;
  sortBy?: string;
  searchQuery?: string;
  status?: string;
};

export type PaginationLinks = {
  self: string;
  nextPage?: string;
  prevPage?: string;
};