import { Request, Response } from "express";
import User from "../models/user";

/**
 * Controller to get the current logged-in user.
 *
 * If the user is found, it returns the user object in the response.
 * If the user is not found, it returns a 404 status with a message "User not found".
 * If any error occurs, it returns a 500 status with a message "Something went wrong".
 */
const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const currentUser = await User.findOne({ _id: req.userId });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(currentUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * Creates a user for the identity established by the verified Auth0 token.
 * Client-provided profile fields are explicitly selected; auth0Id is never
 * accepted from the request body.
 */
const createCurrentUser = async (req: Request, res: Response) => {
  try {
    const auth0Id = req.auth0Id;
    const existingUser = await User.findOne({ auth0Id });

    // Preserve the existing behavior when this user already exists.
    if (existingUser) {
      return res.status(200).send();
    }

    const { email, name, addressLine1, city, country } = req.body;
    const newUser = new User({
      auth0Id,
      email,
      name,
      addressLine1,
      city,
      country,
    });

    await newUser.save();

    res.status(201).json(newUser.toObject());
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating user" });
  }
};

/**
 * Updates the current user in the database with the user information provided in the
 * request body. If the user is not found, it returns a 404 status with a message "User not found".
 * If the user is updated successfully, it returns a 200 status with the updated user object.
 * If any error occurs, it returns a 500 status with a message "Error updating user".
 */
const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const { name, addressLine1, country, city } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name;
    user.addressLine1 = addressLine1;
    user.city = city;
    user.country = country;

    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

export default {
  getCurrentUser,
  createCurrentUser,
  updateCurrentUser,
};
