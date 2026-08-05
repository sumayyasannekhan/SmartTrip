const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    destination: String,
    days: Number,
    budget: Number,
    interest: String,
    itinerary: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Trip", tripSchema);