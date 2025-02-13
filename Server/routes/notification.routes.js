import express from "express";
import { deleteNotification, getNotification } from "../controllers/notification.controller.js";
import {protectedRoute} from "../middleware/protectedRoute.js";

const router = express.Router();

router.get('/',protectedRoute, getNotification);
router.delete("/", protectedRoute, deleteNotification);

export default router;