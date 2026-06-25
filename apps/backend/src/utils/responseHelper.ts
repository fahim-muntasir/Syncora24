import { Response } from "express";

// Define the type for the links
type Links = {
  self?: string;
  next?: string;
  prev?: string;
  [key: string]: string | undefined;
};

type Pagination = { // TODO: it will replace
  page: number;
  limit: number;
  totalPage: number;
  totalItems: number;
  nextPage?: number;
  prevPage?: number;
};

export const successResponse = <T>(
  res: Response,
  data: T,
  message = "Success",
  code = 200,
  links?: Links,
  pagination?: Pagination
) => {
  res.status(code).json({
    success: true,
    code,
    message,
    data,
    links,
    pagination,
  });
};

type Details = {
  field: string;
  message: string;
  code: string;
};

export const errorResponse = (
  res: Response,
  error = "An error occurred",
  code = 500,
  details?: Details[] | null
) => {
  res.status(code).json({
    success: false,
    code,
    error,
    details, // Optional additional error details
  });
};
