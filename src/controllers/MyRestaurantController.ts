import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import Order from "../models/order";

/**
 * Returns the restaurant associated with the current user from the db
 *
 * @param req - Request object
 * @param res - Response object
 * @returns The restaurant associated with the current user if found, otherwise a 404 error.
 * @throws 500 error if there is an error fetching the restaurant
 */
const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
};

/**
 * Creates a new restaurant associated with the current user and saves it to the database.
 *
 * @param req - Request object containing the restaurant details in the body and a file in the request for the image.
 * @param res - Response object
 * @returns The newly created restaurant if successful, otherwise a 409 error if the restaurant already exists for the current user.
 * @throws 500 error if there is an error creating the restaurant
 */
const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });

    if (existingRestaurant) {
      return res
        .status(409)//duplicate in rest apis
        .json({ message: "User restaurant already exists" });
    }

    const imageUrl = await uploadImage(req.file as Express.Multer.File);

    const restaurant = new Restaurant(req.body);
    restaurant.imageUrl = imageUrl;
    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();
    await restaurant.save();

    res.status(201).send(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * Updates the current user's restaurant with the new details.
 *
 * @param req - Request object containing the restaurant details in the body and a file in the request for the image.
 * @param res - Response object
 * @returns The updated restaurant if successful, otherwise a 404 error if the restaurant does not exist for the current user.
 * @throws 500 error if there is an error updating the restaurant
 */

const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    restaurant.restaurantName = req.body.restaurantName;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();

    if (req.file) {
      const imageUrl = await uploadImage(req.file as Express.Multer.File);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();
    res.status(200).send(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

  /**
   * Gets all orders of a given restaurant to its owner
   *
   * @param req - Request object containing the user id in the request
   * @param res - Response object
   * @returns A list of orders if successful, otherwise a 404 error if the restaurant does not exist for the current user, or a 500 error if there is an error getting the orders
   */
const getMyRestaurantOrders = async (req: Request, res: Response) => {// gets all orders to a given restaurant to its owner
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("restaurant")
      .populate("user");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

  /**
   * Updates the status of a given order for the current user's restaurant
   *
   * @param req - Request object containing the order id in the request params, and the new status in the body
   * @param res - Response object
   * @returns The updated order object if successful, otherwise a 404 error if the order does not exist, a 401 error if the current user is not authorized to update the order, or a 500 error if there is an error updating the order
   */
const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;// get the order id from the url
    const { status } = req.body;// get the status from the body of the request , new status.

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    const restaurant = await Restaurant.findById(order.restaurant);
    //just extra security to prevent unauthorized users from updating orders from other user's restaaurants.
    if (restaurant?.user?._id.toString() !== req.userId) {
      return res.status(401).send();
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "unable to update order status" });
  }
};


/**
 * Uploads an image to cloudinary and returns the url
 * @param file - the image file to upload
 * @returns the url of the uploaded image
 */
const uploadImage = async (file: Express.Multer.File) => {
  const image = file;
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export default {
  updateOrderStatus,
  getMyRestaurantOrders,
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant,
};
