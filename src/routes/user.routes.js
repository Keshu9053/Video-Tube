import { Router } from "express";
import userController from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router();

router.route("/example").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ])
    ,userController );


export default router;