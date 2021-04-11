import { coreRouter } from "./core";
import express from "express";

const router = express.Router();

router.use('/', coreRouter);

export default router;
