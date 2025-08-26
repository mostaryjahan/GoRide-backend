import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";
import { seedAdmin } from "./app/utils/seedAdmin";
import { connectRedis } from "./app/config/redis.config";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);
    console.log("connected to DB ✅");

    server = app.listen(5000, () => {
      console.log(`Server is listening to port ${envVars.PORT} `);
    });
  } catch (error) {
    console.log(error);
  }
};

(async () => {
   await connectRedis()
  await startServer();
  await seedAdmin();
})();


process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection detected...... Server shutting down..", err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on("unCaughtException", (err) => {
  console.log("uncaught Exception detected...... Server shutting down..", err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received...... Server shutting down..");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

