import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from './app.js'

dotenv.config();
const port = process.env.PORT || 4000;

app.on("error",(error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
}),

connectDB().then(
    app.listen(port, () => {
        console.log(`App is listening on this PORT : ${port}`)
    })
).catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})



