require("dotenv").config();
console.log(process.env.MONGO_URI);
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const tripRoutes = require("./routes/trips");

const app = express();
let planGenerating = false;
connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.send("🚀 SmartTrip Backend Running");
});
async function generateChunk(prompt, attempt = 1) {

    try {

        console.log(`🤖 Sending request to Groq... Attempt ${attempt}`);

        const completion = await groq.chat.completions.create({

            model: "openai/gpt-oss-120b",

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],

            max_completion_tokens: 1500,
            temperature: 0.7
        });

        console.log("✅ Groq response received");

        return completion.choices[0].message.content;

    } catch (error) {

        console.error("❌ GROQ REQUEST FAILED");
        console.error("Status:", error.status);
        console.error("Message:", error.message);

        if (error.status === 429 && attempt <= 3) {

            const waitTime =
                Number(error.headers?.get?.("retry-after")) * 1000 ||
                6000 * attempt;

            console.log(
                `⏳ Rate limit. Waiting ${waitTime / 1000}s...`
            );

            await new Promise(resolve =>
                setTimeout(resolve, waitTime)
            );

            return generateChunk(prompt, attempt + 1);
        }

        throw error;
    }
}
 
app.post("/api/plan", async (req, res) => {

    console.log("=================================");
    console.log("🔥 /api/plan called");
    console.log("Time:", new Date().toISOString());
    console.log("Body:", req.body);
    console.log("=================================");

    if (planGenerating) {
        console.log("⚠️ Another plan is already being generated.");

        return res.status(429).json({
            error: "A travel plan is already being generated. Please wait."
        });
    }

    planGenerating = true;

    try {

        // Get data from frontend
        const { destination, days, budget, interest } = req.body;

        if (!destination || !days || !budget || !interest) {
            return res.status(400).json({
                error: "Destination, days, budget and interest are required."
            });
        }

        // ================= IMAGE =================

        let imageUrl = "";

        try {

            const imageResponse = await axios.get(
                "https://api.unsplash.com/search/photos",
                {
                    params: {
                        query: `${destination} India`,
                        per_page: 1,
                        orientation: "landscape"
                    },
                    headers: {
                        Authorization:
                            `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (imageResponse.data.results.length > 0) {

                imageUrl =
                    imageResponse.data.results[0].urls.regular;

            } else {

                imageUrl =
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
            }

        } catch (err) {

            console.log("Unsplash Error:", err.message);

            imageUrl =
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
        }

        // ================= AI PLAN =================

        let plan = "";

        const totalDays = Number(days);

        for (let start = 1; start <= totalDays; start++) {

            console.log(`🚀 Requesting Day ${start}`);

            const chunkPrompt = `
You are an expert travel planner.

Generate ONLY itinerary for Day ${start} in ${destination}.

Budget: ₹${budget}
Interest: ${interest}

Return ONLY valid HTML.

Use exactly this structure:

<div class="day-card">

<h2>Day ${start}</h2>

<h3>🌅 Morning</h3>
<p>Morning activity</p>

<h3>☀️ Afternoon</h3>
<p>Afternoon activity</p>

<h3>🌇 Evening</h3>
<p>Evening activity</p>

<h3>🍽 Restaurant</h3>
<p>Restaurant recommendation</p>

<h3>💰 Budget</h3>
<p>Approximate budget</p>

<h3>💡 Travel Tips</h3>
<ul>
<li>Tip 1</li>
<li>Tip 2</li>
</ul>

<h3>📍 Google Maps</h3>

<a href="https://www.google.com/maps/search/Actual Place Name ${destination}" target="_blank">
📍 Open in Google Maps
</a>

</div>

Rules:

- Generate ONLY Day ${start}.
- Do NOT generate another day.
- Do NOT use Markdown.
- Return only HTML.
- Every day must visit different places.
- Do not repeat attractions.
- Choose famous attractions based on the selected interest.
- Keep the itinerary unique.
`;

            const chunk = await generateChunk(chunkPrompt);

            console.log(`✅ Received Day ${start}`);
            console.log("Chunk Length:", chunk.length);

            plan += chunk + "\n";

            // Wait between requests
            if (start < totalDays) {
                await new Promise(resolve =>
                    setTimeout(resolve, 6000)
                );
            }
        }

        console.log("=================================");
        console.log("PLAN LENGTH:", plan.length);
        console.log("DAY CARDS:",
            (plan.match(/day-card/g) || []).length
        );
        console.log("=================================");

        // ================= LOCATION =================

        let coordinates = null;

        try {

            const geo = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: destination,
                        format: "json",
                        limit: 1
                    },
                    headers: {
                        "User-Agent": "SmartTrip"
                    }
                }
            );

            if (geo.data.length > 0) {

                coordinates = {
                    lat: geo.data[0].lat,
                    lon: geo.data[0].lon
                };

            }

        } catch (err) {

            console.log("Geo Error:", err.message);

        }

        // ================= WEATHER =================

        let weather = null;

        if (coordinates) {

            try {

                const weatherResponse = await axios.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    {
                        params: {
                            lat: coordinates.lat,
                            lon: coordinates.lon,
                            appid: process.env.WEATHER_API_KEY,
                            units: "metric"
                        }
                    }
                );

                weather = {
                    temperature:
                        weatherResponse.data.main.temp,

                    humidity:
                        weatherResponse.data.main.humidity,

                    description:
                        weatherResponse.data.weather[0].description,

                    wind:
                        weatherResponse.data.wind.speed
                };

            } catch (err) {

                console.log("Weather Error:", err.message);

            }
        }

        // ================= TRANSPORT =================

        let transport = [];

        if (Number(budget) <= 5000) {

            transport = [
                "🚌 Bus",
                "🚆 Train",
                "🚖 Auto Rickshaw"
            ];

        } else if (Number(budget) <= 15000) {

            transport = [
                "🚆 Train",
                "🏍 Bike Rental",
                "🚖 Taxi"
            ];

        } else {

            transport = [
                "✈ Flight",
                "🚗 Rental Car",
                "🚖 Cab"
            ];
        }

        // ================= RESPONSE =================

        res.json({
            plan,
            image: imageUrl,
            weather,
            coordinates,
            transport
        });

    } catch (error) {

        console.error("❌ Plan generation failed:");
        console.error(error);

        res.status(500).json({
            plan: "",
            error: error.message
        });

    } finally {

        planGenerating = false;

        console.log("🔓 Plan generation unlocked.");
    }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});