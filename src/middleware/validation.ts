import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Returns a 400 response when request validation fails.
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateMyUserRequest = [
  body("name").isString().notEmpty().withMessage("Name must be a string"),
  body("addressLine1")
    .isString()
    .notEmpty()
    .withMessage("AddressLine1 must be a string"),
  body("city").isString().notEmpty().withMessage("City must be a string"),
  body("country").isString().notEmpty().withMessage("Country must be a string"),
  handleValidationErrors,
];

export const validateMyRestaurantRequest = [
  body("restaurantName").notEmpty().withMessage("Restaurant name is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("deliveryPrice")
    .isFloat({ min: 0 })
    .withMessage("Delivery price must be a positive number"),
  body("estimatedDeliveryTime")
    .isInt({ min: 0 })
    .withMessage("Estimated delivery time must be a positive integer"),
  body("cuisines")
    .isArray()
    .withMessage("Cuisines must be an array")
    .not()
    .isEmpty()
    .withMessage("Cuisines array cannot be empty"),
  body("menuItems").isArray().withMessage("Menu items must be an array"),
  body("menuItems.*.name").notEmpty().withMessage("Menu item name is required"),
  body("menuItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Menu item price is required and must be a positive number"),
  handleValidationErrors,
];

export const validateCheckoutSessionRequest = [
  body("restaurantId")
    .isMongoId()
    .withMessage("A valid restaurant ID is required"),
  body("cartItems")
    .isArray({ min: 1 })
    .withMessage("Cart must contain at least one item"),
  body("cartItems.*.menuItemId")
    .isMongoId()
    .withMessage("Each cart item must have a valid menu item ID"),
  body("cartItems.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Each item quantity must be a positive integer"),
  body("deliveryDetails").isObject().withMessage("Delivery details are required"),
  body("deliveryDetails.email")
    .isEmail()
    .withMessage("A valid delivery email is required"),
  body("deliveryDetails.name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Delivery name is required"),
  body("deliveryDetails.addressLine1")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Delivery address is required"),
  body("deliveryDetails.city")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Delivery city is required"),
  handleValidationErrors,
];

/**
 * Validates an order status update without changing the existing status workflow.
 */
export const validateOrderStatusRequest = [
  param("orderId")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ID"),
  body("status")
    .isIn(["placed", "paid", "inProgress", "outForDelivery", "delivered"])
    .withMessage("Invalid order status"),
  handleValidationErrors,
];
