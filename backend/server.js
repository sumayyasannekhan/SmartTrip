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
async function generateChunk(prompt) {
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        max_completion_tokens: 2500,
        temperature: 0.7
    });

    return completion.choices[0].message.content;
}
app.post("/api/plan", async (req, res) => {
    console.log("✅ /api/plan called");
    console.log(req.body);

  try {
    const { destination, days, budget, interest } = req.body;

  
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
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
            }
        }
    );

    if (imageResponse.data.results.length > 0) {
    imageUrl = imageResponse.data.results[0].urls.regular;
} else {
    imageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
}
} catch (err) {
    console.log("Unsplash Error:", err.message);
}
let plan = "";

const totalDays = Number(days);

for (let start = 1; start <= totalDays; start++) {

    const end = start;

    try {

        console.log(`🚀 Requesting Days ${start}-${end}`);

const chunkPrompt = `
You are an expert travel planner.

Generate ONLY itinerary for Day ${start} in ${destination}.

Budget: ₹${budget}
Interest: ${interest}

Return ONLY valid HTML in EXACTLY this format:

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
Google Maps:
Generate a clickable HTML link in exactly this format:

<a href="https://www.google.com/maps/search/Actual Place Name ${destination}" target="_blank">
📍 Open in Google Maps
</a>

Example:

<a href="https://www.google.com/maps/search/Nandi Hills Bengaluru" target="_blank">
📍 Open in Google Maps
</a>

Never print the full URL as text.
Never use "Click here".
Always use "📍 Open in Google Maps" as the link text.

</div>

Rules:
- Generate ONLY Day ${start}.
- Do NOT generate any other day.
- Do NOT use Markdown.
- Do NOT output raw Google Maps URLs.
- Always use the clickable text "📍 Open in Google Maps".
- Follow this HTML structure exactly.
Additional Rules:
- Every day must visit different places.
- Do not repeat attractions across different days.
- Choose famous attractions based on the selected interest.
- Keep each day's itinerary unique.
`;

        const chunk = await generateChunk(chunkPrompt);

        console.log(`✅ Received Days ${start}-${end}`);
        console.log("Chunk Length:", chunk.length);

        plan += chunk + "\n";

        await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {

        console.error(`❌ Failed to generate Days ${start}-${end}`);
        console.error(err);

        break; // stop if one chunk fails
    }
}
    
console.log("PLAN LENGTH:", plan.length);
console.log(plan);
let coordinates = null;

// First get coordinates
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

// Now get weather
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
            temperature: weatherResponse.data.main.temp,
            humidity: weatherResponse.data.main.humidity,
            description: weatherResponse.data.weather[0].description,
            wind: weatherResponse.data.wind.speed
        };

    } catch (err) {
        console.log("Weather Error:", err.message);
    }
}
let transport = [];

if (Number(budget) <= 5000) {

    transport = [
        "🚌 Bus",
        "🚆 Train",
        "🚖 Auto Rickshaw"
    ];

}
else if (Number(budget) <= 15000) {

    transport = [
        "🚆 Train",
        "🏍 Bike Rental",
        "🚖 Taxi"
    ];

}
else {

    transport = [
        "✈ Flight",
        "🚗 Rental Car",
        "🚖 Cab"
    ];

}
      
  res.json({
    plan,
    image: imageUrl,
    weather,
    coordinates,
    transport
});

  } catch (error) {
   console.error("Groq Error:");
console.error(error.response?.data || error);

    res.status(500).json({
      plan: "<h2>❌ Error generating itinerary.</h2>",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});