const express = require("express");
const Trip = require("../models/Trip");

const router = express.Router();

// Save Trip
router.post("/save", async (req, res) => {
    try {
        const trip = new Trip(req.body);

        console.log("Saving itinerary length:", req.body.itinerary.length);
        console.log(
            "Saving day cards:",
            (req.body.itinerary.match(/day-card/g) || []).length
        );

        await trip.save();

        res.json({
            message: "Trip Saved Successfully"
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });
    }
});

// Get ALL Trips
router.get("/", async (req, res) => {
    try {
        const trips = await Trip.find().sort({ createdAt: -1 });

        res.json(trips);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }
});

// Get ONE Trip
router.get("/:id", async (req, res) => {
    try {

        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                message: "Trip not found"
            });
        }

        res.json(trip);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }
});

module.exports = router;
// Delete Trip
router.delete("/:id", async (req, res) => {
    try {
        await Trip.findByIdAndDelete(req.params.id);

        res.json({
            message: "Trip deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: "Server Error"
        });
    }
});