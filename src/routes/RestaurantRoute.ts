import express from "express";
import { param } from "express-validator";
import RestaurantController from "../controllers/RestaurantController";
import { handleValidationErrors } from "../middleware/validation";

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
    .withMessage("City must be a non-empty string"),
  handleValidationErrors,
  RestaurantController.searchRestaurant
);

export default router;
