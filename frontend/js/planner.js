let generatedPlan = "";
let map;
// Check if user is logged in
const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
}
console.log("planner.js loaded");
const generateBtn = document.getElementById("generateBtn");

generateBtn.addEventListener("click", async () => {

    const destination = document.getElementById("destination").value;
    const days = document.getElementById("days").value;
    const budget = document.getElementById("budget").value;
    const interest = document.getElementById("interest").value;

    if (!destination || !days || !budget) {
        alert("Please fill all fields");
        return;
    }

    document.getElementById("result").innerHTML =
        "<h2>Generating your AI Travel Plan...</h2>";

    try {

        const response = await fetch("https://smarttrip-wpja.onrender.com/api/plan", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                destination,
                days,
                budget,
                interest
            })

        });

        if (!response.ok) {
    const text = await response.text();
    console.log(text);
    throw new Error(text);
}

const data = await response.json();

generatedPlan = data.plan;
console.log("Generated Plan Length:", generatedPlan.length);
console.log("Received plan length:", generatedPlan.length);
console.log("Day cards:", (generatedPlan.match(/day-card/g) || []).length);
console.log(generatedPlan);
console.log(data);
console.log("PLAN:");
console.log(data.plan);

console.log(document.getElementById("result").innerHTML);
        if(data.coordinates){

    const lat = data.coordinates.lat;
    const lon = data.coordinates.lon;

    if (map) {
    map.remove();
}

map = L.map("map").setView([lat, lon], 12);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "© OpenStreetMap contributors"
        }
    ).addTo(map);

    L.marker([lat, lon])
        .addTo(map)
        .bindPopup(destination)
        .openPopup();
}

        // Destination images
        const destinationImages = {
            goa: "images/goa.jpg",
            mysore: "images/mysore.jpg",
            ooty: "images/ooty.jpg",
            coorg: "images/coorg.jpg",
            manali: "images/manali.jpg",
            delhi: "images/delhi.jpg",
            mumbai: "images/mumbai.jpg"
        };

        const image =
            destinationImages[destination.toLowerCase()] ||
            "images/default.jpg";

document.getElementById("saveTripBtn").style.display = "inline-block";

document.getElementById("result").innerHTML = `
    <img src="${data.image}" class="place-image">

    <div class="weather-card">
        <h2> Weather in ${destination}</h2>
        <p><strong>Temperature:</strong> ${data.weather.temperature}°C</p>
        <p><strong>Condition:</strong> ${data.weather.description}</p>
        <p><strong>Humidity:</strong> ${data.weather.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${data.weather.wind} m/s</p>
    </div>

   
    <div class="info-card">
        <h2>Suggested Transport</h2>

        <ul>
            ${data.transport
                .map(t => `<li>${t}</li>`)
                .join("")}
        </ul>
    </div>

    ${data.plan}
`;
console.log(document.getElementById("result").innerHTML);
    } catch (err) {

        document.getElementById("result").innerHTML =
            "<h2> Unable to generate itinerary.</h2>";

        console.log(err);

    }

});
const downloadBtn = document.getElementById("downloadBtn");

downloadBtn.addEventListener("click", async () => {

    const element = document.getElementById("result");

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = 297;

    const imgWidth = pdfWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

while (heightLeft > 0) {

    position = position - pdfHeight;

    pdf.addPage();

    pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
    );

    heightLeft -= pdfHeight;
}

    pdf.save("SmartTrip-Itinerary.pdf");
});

  const saveBtn = document.getElementById("saveTripBtn");

saveBtn.addEventListener("click", async () => {

    const user = JSON.parse(localStorage.getItem("user"));

    const trip = {
        userId: user ? user.id : null,
        destination: document.getElementById("destination").value,
        days: document.getElementById("days").value,
        budget: document.getElementById("budget").value,
        interest: document.getElementById("interest").value,
        itinerary: generatedPlan
    };

    console.log("===== ITINERARY TO SAVE =====");
console.log(trip.itinerary);
console.log("Length:", trip.itinerary.length);
console.log("Saving day cards:",
    (trip.itinerary.match(/day-card/g) || []).length);

    try {

        const response = await fetch("https://smarttrip-wpja.onrender.com/api/trips/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(trip)
        });

        const data = await response.json();

        alert(data.message);

    } catch (err) {

        console.log(err);
        alert("❌ Unable to save trip.");

    }

});
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("Logged out successfully!");

    window.location.href = "login.html";
}
