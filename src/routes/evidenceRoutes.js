import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { getEvidence, getAllEvidence, deleteEvidence, deleteAllEvidence } from "../controllers/evidence.controller.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const evidenceRouter = express.Router();

// admin routes only (is admin role is still remaining for test)
evidenceRouter.get("/:id", verifyJWT, isAdmin, getEvidence); 
evidenceRouter.get("/", verifyJWT, isAdmin, getAllEvidence);
evidenceRouter.delete("/:id", verifyJWT, isAdmin, deleteEvidence);
evidenceRouter.delete("/", verifyJWT, isAdmin, deleteAllEvidence);   

export default evidenceRouter;