import { Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import jwt from "jsonwebtoken";
import User from "../models/user";

// to add custom prps to express request
declare global {
  namespace Express {
    interface Request {
      userId: string;
      auth0Id:string;
    }
  }
}
/**
 *Method that checks the authorization header for the bearer token
 *which is sent by the frontend in myuserapi.tsx
 *it connects to the auth0 server and checks if the token in the request belongs to a loged in user
 */
export const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

/**
 * To parse the token to get our id
  */ 
export const jwtParse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //const token = req.headers.authorization?.split(" ")[1]; // basically the same thing as bellow
  const {authorization}=req.headers;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    // because the request had
    // a header field named "Bearer " 
    return res.sendStatus(401);// meaning access not authorized

  }
  // Bearer asdsnddbqsdnbsd
  const token=authorization.split(" ")[1];// gets the asdsnddbqsdnbsd
  try {
    const decoded= jwt.decode(token) as jwt.JwtPayload;
    // get user's auth0 id from the token(which was decoded above)
    const auth0Id=decoded.sub;
    const user= await User.findOne({auth0Id});
    //search the db to find the user with that auth0 id
    if(!user){
      return res.sendStatus(401);
    }
    req.auth0Id=auth0Id as string;
    req.userId= user._id.toString();
    next();

  } catch (error) {
    console.log(error);
    res.sendStatus(401);
  }

};
