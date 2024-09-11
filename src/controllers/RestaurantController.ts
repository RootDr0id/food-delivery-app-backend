import { Request, Response } from "express";
import Restaurant from "../models/restaurant";

/**
 * Gets a restaurant by its id.
 * @param req - Express request object
 * @param res - Express response object
 * @throws 404 if restaurant is not found
 * @throws 500 if there is an error getting the restaurant
 */
const getRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.restaurantId;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

    /**
     * Searches for restaurants in a given city based on the search query and selected cuisines.
     * @param req - Express request object
     * @param res - Express response object
     * @param city - the city to search for restaurants in
     * @param searchQuery - the search query
     * @param selectedCuisines - the selected cuisines
     * @param sortOption - the sort option
     * @param page - the page number
     * @throws 404 if the city does not have any restaurants
     * @throws 500 if there is an error searching for restaurants
     */
const searchRestaurant = async (req: Request, res: Response) => {
  try {
    const city = req.params.city;//"london"

    const searchQuery = (req.query.searchQuery as string) || "";//"london"
    const selectedCuisines = (req.query.selectedCuisines as string) || "";//"Indian, Chinese"
    const sortOption = (req.query.sortOption as string) || "lastUpdated";
    const page = parseInt(req.query.page as string) || 1;

    let query: any = {};

    query["city"] = new RegExp(city, "i");// i means case insensitive
    const cityCheck = await Restaurant.countDocuments(query);//counts the number of documents that match the query
    if (cityCheck === 0) {
      return res.status(404).json({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 1,
        },
      });
    }   

    if (selectedCuisines) {//selectedCuisines = "Indian, Chinese"
      const cuisinesArray = selectedCuisines
        .split(",")//"Indian, Chinese" => ["Indian", "Chinese"]
        .map((cuisine) => new RegExp(cuisine, "i"));//["Indian", "Chinese"] => [new RegExp("Indian", "i"), new RegExp("Chinese", "i")]

      query["cuisines"] = { $all: cuisinesArray };//query["cuisines"] = { $all: ["Indian", "Chinese"]}
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      query["$or"] = [
        { restaurantName: searchRegex },
        { cuisines: { $in: [searchRegex] } },
      ];
    }/* allows the query to match documents where either the restaurant name or one of the cuisines
     matches the search query, regardless of case.
    ex: if the searchQuery is "Italian", the query will match documents where
   the restaurant name contains "Italian" (e.g. "Italian Kitchen") 
   or where one of the cuisines is "Italian".*/
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    //This determines how many of the records in the serach results to skip based on the page and page size
    // So if the frontend requests page 2 and page size 10, it will skip the first 10 records and return the next 10 in the second page
    // We have a pagination system in place.


    // if sortOption = "lastUpdated"
    const restaurants = await Restaurant.find(query)//Find the records based on the query
      .sort({ [sortOption]: 1 })//Sort the records based on the sortOption
      .skip(skip)//Skip the first 10 records
      .limit(pageSize)
      .lean();//converts the document into a plain javascript object without the metadata(mongoos id)

    const total = await Restaurant.countDocuments(query);

    const response = {
      data: restaurants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / pageSize),//number of pages 
      },
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export default {
  getRestaurant,
  searchRestaurant,
};
