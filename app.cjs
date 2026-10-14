// GoDaddy cPanel / Phusion Passenger entry point
process.env.NODE_ENV = process.env.NODE_ENV || "production";
import("./dist/index.js").catch((err) => {
  console.error("Failed to start iConnect BLR server:", err);
  process.exit(1);
});
