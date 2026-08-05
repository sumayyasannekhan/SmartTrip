const tripList = document.getElementById("tripList");
const searchInput = document.getElementById("searchTrip");

let allTrips = [];

async function loadTrips() {

    try {

        const response = await fetch("https://smarttrip-wpja.onrender.com/api/trips");

        const trips = await response.json();
        allTrips = trips;
displayTrips(allTrips);
return;

       } catch (err) {

        console.log(err);

        tripList.innerHTML = "<h2>Unable to load trips.</h2>";

    }

}

loadTrips();


function displayTrips(trips) {

    tripList.innerHTML = "";

    trips.forEach((trip) => {

        tripList.innerHTML += `
        <div class="day-card">

            <h2>${trip.destination}</h2>

            <p><strong>Days:</strong> ${trip.days}</p>

            <p><strong>Budget:</strong> ₹${trip.budget}</p>

            <p><strong>Interest:</strong> ${trip.interest}</p>

          <button class="btn viewBtn"
    data-id="${trip._id}">
    View Itinerary
</button>

<button class="btn deleteBtn"
    data-id="${trip._id}">
    🗑 Delete
</button>

        </div>
        `;
    });

    document.querySelectorAll(".viewBtn").forEach(btn => {

        btn.onclick = async () => {

            const response = await fetch(
                `https://smarttrip-wpja.onrender.com/api/trips/${btn.dataset.id}`
            );

            const trip = await response.json();

            
            const newWindow = window.open("", "_blank");

            newWindow.document.write(`
                <html>
                <head>
                    <link rel="stylesheet" href="css/style.css">
                </head>
                <body>
                    ${trip.itinerary}
                </body>
                </html>
            `);
        };
    });
            document.querySelectorAll(".deleteBtn").forEach(btn => {

    btn.onclick = async () => {

        if (!confirm("Delete this trip?")) return;

        await fetch(
            `https://smarttrip-wpja.onrender.com/api/trips/${btn.dataset.id}`,
            {
                method: "DELETE"
            }
        );

        loadTrips();

    };

});

}
searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.toLowerCase();

    const filtered = allTrips.filter(trip =>
        trip.destination.toLowerCase().includes(keyword)
    );

    displayTrips(filtered);

});