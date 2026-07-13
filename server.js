require("dotenv").config();

console.log("MONGO_URI:", process.env.MONGO_URI ? "FOUND" : "MISSING");

const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 5001;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });