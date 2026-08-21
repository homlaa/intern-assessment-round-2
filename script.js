const form = document.getElementById("registrationForm");
const clearButton = document.getElementById("clearButton");
const weatherDiv = document.getElementById("weather");
const statusDiv = document.getElementById("status");
const cityInput = document.getElementById("city");

let selectedLocation = null;

function validateForm() {
    let isValid = true;

    document.querySelectorAll(".error").forEach(error => {
        error.textContent = "";
    });

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const birthdate = document.getElementById("birthdate").value;
    const city = cityInput.value.trim();

    if (!firstName) {
        document.getElementById("firstNameError").textContent = "First name is required.";
        isValid = false;
    }

    if (!lastName) {
        document.getElementById("lastNameError").textContent = "Last name is required.";
        isValid = false;
    }

    if (!birthdate) {
        document.getElementById("birthdateError").textContent = "Birthdate is required.";
        isValid = false;
    }

    if (!city) {
        document.getElementById("cityError").textContent = "City is required.";
        isValid = false;
    }

    return isValid;
}

cityInput.addEventListener("change", async () => {
    const city = cityInput.value.trim();

    selectedLocation = null;
    weatherDiv.textContent = "";
    statusDiv.textContent = "";

    if (!city) {
        return;
    }

    weatherDiv.textContent = "Loading weather...";

    try {
        const geocodingResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`
        );

        if (!geocodingResponse.ok) {
            throw new Error("Geocoding request failed.");
        }

        const geocodingData = await geocodingResponse.json();

        if (!geocodingData.results || geocodingData.results.length === 0) {
            weatherDiv.textContent = "City not found.";
            statusDiv.textContent = "Error: City could not be found.";
            return;
        }

        const location = geocodingData.results[0];

        selectedLocation = {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude
        };

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`
        );

        if (!weatherResponse.ok) {
            throw new Error("Weather request failed.");
        }

        const weatherData = await weatherResponse.json();

        const temperature = weatherData.current_weather.temperature;
        const windspeed = weatherData.current_weather.windspeed;

        weatherDiv.innerHTML = `
            <strong>${location.name}</strong><br>
            Latitude: ${location.latitude}<br>
            Longitude: ${location.longitude}<br>
            Temperature: ${temperature}°C<br>
            Windspeed: ${windspeed} km/h
        `;
    } catch (error) {
        console.error("Weather error:", error);
        weatherDiv.textContent = "Unable to retrieve weather information.";
        statusDiv.textContent = `Weather error: ${error.message}`;
    }
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!validateForm()) {
        statusDiv.textContent = "Please complete all fields.";
        return;
    }

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const birthdate = document.getElementById("birthdate").value;
    const city = cityInput.value.trim();

    if (!selectedLocation || selectedLocation.name.toLowerCase() !== city.toLowerCase()) {
        statusDiv.textContent = "Please select a valid city first.";
        return;
    }

    statusDiv.textContent = "Registering attendee...";

    try {
        const response = await fetch("http://localhost:3000/api/attendees", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                firstName,
                lastName,
                birthdate,
                city: selectedLocation.name,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
            })
        });

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(
                `Server returned an invalid response: ${responseText.substring(0, 100)}`
            );
        }

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        statusDiv.textContent =
            `Registration successful! Attendee ID: ${data.attendeeId}`;
    } catch (error) {
        console.error("Registration error:", error);
        statusDiv.textContent = `Registration failed: ${error.message}`;
    }
});

clearButton.addEventListener("click", () => {
    form.reset();

    document.querySelectorAll(".error").forEach(error => {
        error.textContent = "";
    });

    weatherDiv.textContent = "";
    statusDiv.textContent = "";
    selectedLocation = null;
});