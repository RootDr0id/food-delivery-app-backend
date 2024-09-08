import express, {Request,Response} from 'express';
import cors from 'cors';
import "dotenv/config";
import mongoose from 'mongoose';
import myUserRoute from './routes/MyUserRoutes';
mongoose
.connect(process.env.MONGODB_CONNECTION_STRING as string)
.then(()=>console.log("Connected to Database"))
.catch((err)=>console.log(err))

const app=express();
app.use(express.json());
app.use(cors());

//Add a health endpoint to our server to check if the server is up
app.get("/health", async (req: Request, res: Response) => {
    res.send({message:"health OK!"});
})

app.use("/api/my/user",myUserRoute);

app.listen(7000, ()=>{
    console.log("Listening on port 7000");
})