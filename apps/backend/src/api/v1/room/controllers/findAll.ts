import { Response, Request, NextFunction } from "express";
import { findAllItems } from "../../../../lib/room";
import {
  paginationGenerate,
  generatePaginationLinks,
} from "../../../../utils/pagination";
import { successResponse } from "../../../../utils/responseHelper";
import { tokenValidator } from "../../../../lib/auth";
import { isUserType } from "../../../../utils/typeGuards";

export const getRoomsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = +(req.query.page ?? 1);
  const limit = +(req.query.limit ?? 10);
  const sortType = (req.query.sortType as string) || "desc";
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const searchQuery = (req.query.search as string) || "";
  const status = (req.query.status as string) || "";
  const category = (req.query.category as string) || "";
  const difficulty = (req.query.difficulty as string) || "";
  const duration = +(req.query.duration as string) || 1;

  try {
    const { data } = await findAllItems();

    // const { pagination, totalPage } = paginationGenerate({
    //   page,
    //   limit,
    //   totalItems,
    // });

    const links = generatePaginationLinks({
      path: req.baseUrl + req.path,
      page,
      // totalPage,
      limit,
      sortType,
      sortBy,
      searchQuery,
      status,
    });

    // send final response
    successResponse(
      res,
      data,
      "Rooms fetched successfully",
      201,
      links,
      // pagination
    );
  } catch (error) {
    next(error);
  }
};
