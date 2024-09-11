import { Request, Response } from "express";
import User from "../models/user";

/**
 * Controller to get the current logged in user.
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

    res.json(currentUser); //retrun the user to the calling client
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}; 

  /**
   * Creates a new user in the database using the user information provided in the
   * request body. If the user already exists, it returns a 200 status with no content.
   * If the user is created successfully, it returns a 201 status with the created user object.
   * If any error occurs, it returns a 500 status with a message "Error creating user".
   */
const createCurrentUser = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.body;
    const existingUser = await User.findOne({ auth0Id });
    // Check if the user exists, create it if not and then retrun the user object to the client
    if (existingUser) {
      return res.status(200).send();
    }

    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).json(newUser.toObject()); //returs the object
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
    const { name, addressLine1, country, city } = req.body; // data sent by the frontend form
    const user = await User.findById(req.userId);

    if (!user) {
      // if user not found in our db
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name;
    user.addressLine1 = addressLine1;
    user.city = city;
    user.country = country;

    await user.save(); //saves the user to the db
    res.send(user); // send the user to the calling client if it needs it.
    //In our case it'll be useful for testing with our rest api (postman/insomnia) before implementing it in the frontend
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
