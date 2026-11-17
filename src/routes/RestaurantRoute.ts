import express from "express";
import { param } from "express-validator";
import RestaurantController from "../controllers/RestaurantController";
import {
  handleValidationErrors,
  validateRestaurantSearchRequest,
} from "../middleware/validation";

const router = express.Router();

// /api/restaurant/
router.get(
  "/:restaurantId",
  param("restaurantId")
    .isMongoId()
    .withMessage("Restaurant ID must be a valid MongoDB ID"),
  handleValidationErrors,
  RestaurantController.getRestaurant
);

// /api/restaurant/search/london
router.get(
  "/search/:city",
  param("city")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage("City must be a non-empty string of at most 100 characters"),
  validateRestaurantSearchRequest,
  RestaurantController.searchRestaurant
);

export default router;
