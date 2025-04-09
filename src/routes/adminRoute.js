import express from 'express';
import { verifyJWT} from "../middlewares/auth.js";
import { getSingleUser, getAllUsers, deleteUser, deleteAllUsers, updateUser, AdminDashboard } from "../controllers/user.controller.js"
import { isAdmin } from "../middlewares/isAdmin.js";

const adminRouter = express.Router();

// for managing users
adminRouter.route('/').get(verifyJWT, isAdmin, getAllUsers);
adminRouter.route('/:id').get(verifyJWT, isAdmin, getSingleUser);
adminRouter.route('/:id').put(verifyJWT, isAdmin, updateUser);
adminRouter.route('/:id').delete(verifyJWT, isAdmin, deleteUser);
adminRouter.route('/').delete(verifyJWT, isAdmin, deleteAllUsers);
adminRouter.route('/dashboard/getDashboard').get(verifyJWT, isAdmin, AdminDashboard);

export default adminRouter;