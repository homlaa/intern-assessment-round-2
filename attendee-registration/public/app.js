const form = document.querySelector("#registration-form");
const statusElement = document.querySelector("#status");
const weatherElement = document.querySelector("#weather");
const weatherCityElement = document.querySelector("#weather-city");
const temperatureElement = document.querySelector("#temperature");
const windspeedElement = document.querySelector("#windspeed");
const saveButton = document.querySelector("#save-button");

async function getCityCoordinates(city) {
  try {
    const encodedCity = encodeURIComponent(city);

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodedCity}`
    );

    if (!response.ok) {
      throw new Error(
        `Geocoding request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("City not found");
    }

    const firstResult = data.results[0];

    return {
      name: firstResult.name,
      latitude: firstResult.latitude,
      longitude: firstResult.longitude
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

async function getCurrentWeather(latitude, longitude) {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current_weather=true";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Weather request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.current_weather) {
      throw new Error("Current weather is unavailable");
    }

    return {
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed
    };
  } catch (error) {
    console.error("Weather error:", error);
    throw error;
  }
}

function readFormData() {
  const formData = new FormData(form);

  return {
    firstName: formData.get("firstName").trim(),
    lastName: formData.get("lastName").trim(),
    birthdate: formData.get("birthdate"),
    city: formData.get("city").trim()
  };
}

function validateRegistration(registration) {
  if (!registration.firstName) {
    return "First name is required";
  }

  if (!registration.lastName) {
    return "Last name is required";
  }

  if (!registration.birthdate) {
    return "Birthdate is required";
  }

  if (!registration.city) {
    return "City is required";
  }

  return null;
}

function displayWeather(city, weather) {
  weatherCityElement.textContent = city;
  temperatureElement.textContent = `${weather.temperature} °C`;
  windspeedElement.textContent = `${weather.windspeed} km/h`;

  weatherElement.hidden = false;
}

async function saveAttendee(registration, location) {
  const response = await fetch("/api/attendees", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      ...registration,
      city: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Registration failed");
  }

  return result;
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  statusElement.className = "status";
  statusElement.textContent = "";
  weatherElement.hidden = true;

  const registration = readFormData();
  const validationError = validateRegistration(registration);

  if (validationError) {
    statusElement.classList.add("error");
    statusElement.textContent = validationError;
    return;
  }

  saveButton.disabled = true;

  try {
    statusElement.textContent = "Finding city...";

    const location = await getCityCoordinates(registration.city);

    statusElement.textContent = "Loading weather...";

    const weather = await getCurrentWeather(
      location.latitude,
      location.longitude
    );

    displayWeather(location.name, weather);

    statusElement.textContent = "Saving registration...";

    const attendee = await saveAttendee(
      registration,
      location
    );

    statusElement.classList.add("success");
    statusElement.textContent =
      `Registration saved for ${attendee.first_name} ` +
      `${attendee.last_name}.`;
  } catch (error) {
    statusElement.classList.add("error");
    statusElement.textContent = error.message;
  } finally {
    saveButton.disabled = false;
  }
});

form.addEventListener("reset", () => {
  statusElement.textContent = "";
  statusElement.className = "status";
  weatherElement.hidden = true;
});