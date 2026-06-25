import mongoose from "mongoose";

export const dbConnection = () => {
  const options = {
    autoIndex: false,
    dbName: process.env.DB_NAME,
    // serverSelectionTimeoutMS: 5000,
  };

  if (!process.env.DB_URL) {
    throw new Error("DB_URL is not defined in the environment variables");
  }
  return mongoose.connect(process.env.DB_URL, options);
};

mongoose.connection.on("connected", () =>
  console.log("Database connection successful")
);