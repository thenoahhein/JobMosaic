import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "update latent scores",
  { hours: 24 }, // Run daily
  internal.scoring.updateAllLatentScores
);

export default crons;