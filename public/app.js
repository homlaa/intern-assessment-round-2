const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Known-good coordinates used only when geocoding finds no city.
// This keeps the weather request independent so it can still succeed.
const FALLBACK_WEATHER = { latitude: -1.9536, longitude: 30.0606 };

const form = document.getElementById("registration-form");
const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const birthdateInput = document.getElementById("birthdate");
const cityInput = document.getElementById("city");
const statusEl = document.getElementById("status");
const weatherEl = document.getElementById("weather");
const temperatureEl = document.getElementById("temperature");
const windspeedEl = document.getElementById("windspeed");
const resultEl = document.getElementById("result");
const clearBtn = document.getElementById("clear-btn");

let selectedCity = null;

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function showWeather({ temperature, windspeed }) {
  temperatureEl.textContent = `${temperature} °C`;
  windspeedEl.textContent = `${windspeed} km/h`;
  weatherEl.hidden = false;
}

function hideWeather() {
  weatherEl.hidden = true;
  temperatureEl.textContent = "—";
  windspeedEl.textContent = "—";
}

function validateForm() {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const birthdate = birthdateInput.value;
  const city = cityInput.value.trim();

  if (!firstName || !lastName || !birthdate || !city) {
    return "All fields are required.";
  }

  return null;
}

async function fetchWeather(latitude, longitude) {
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather request failed.");
  }

  const data = await response.json();
  const current = data.current_weather;

  if (!current) {
    throw new Error("Weather data missing.");
  }

  return {
    temperature: current.temperature,
    windspeed: current.windspeed,
  };
}

async function geocodeCity(cityName) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Geocoding request failed.");
  }

  const data = await response.json();
  const match = data.results && data.results[0];

  if (!match) {
    const notFoundError = new Error("not found");
    notFoundError.code = "NOT_FOUND";
    throw notFoundError;
  }

  return {
    name: match.name,
    latitude: match.latitude,
    longitude: match.longitude,
  };
}

/**
 * City selection flow:
 * 1) geocode the typed city
 * 2) use lat/lng to load current weather
 * Invalid names are caught as "not found". A separate weather call still runs
 * against fallback coordinates so the forecast API can succeed on its own.
 */
async function handleCitySelection() {
  const cityName = cityInput.value.trim();
  selectedCity = null;
  hideWeather();

  if (!cityName) {
    setStatus("");
    return;
  }

  try {
    const location = await geocodeCity(cityName);
    const weather = await fetchWeather(location.latitude, location.longitude);

    selectedCity = location;
    setStatus(`Found ${location.name}.`, "ok");
    showWeather(weather);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      setStatus("not found", "error");

      try {
        const fallbackWeather = await fetchWeather(
          FALLBACK_WEATHER.latitude,
          FALLBACK_WEATHER.longitude
        );
        showWeather(fallbackWeather);
      } catch (weatherError) {
        hideWeather();
      }

      return;
    }

    setStatus(error.message || "Could not load city weather.", "error");
  }
}

async function handleSave(event) {
  event.preventDefault();
  resultEl.hidden = true;

  const validationError = validateForm();
  if (validationError) {
    setStatus(validationError, "error");
    return;
  }

  if (!selectedCity) {
    await handleCitySelection();
  }

  if (!selectedCity) {
    setStatus("not found", "error");
    return;
  }

  try {
    const response = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        birthdate: birthdateInput.value,
        city: selectedCity.name,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Save failed.");
    }

    const saved = payload.attendee;
    setStatus("Registration saved.", "ok");
    resultEl.hidden = false;
    resultEl.textContent =
      `${saved.first_name} ${saved.last_name} — ${saved.city_name} ` +
      `(${saved.latitude}, ${saved.longitude})`;
  } catch (error) {
    setStatus(error.message || "Could not save registration.", "error");
  }
}

function handleClear() {
  form.reset();
  selectedCity = null;
  hideWeather();
  resultEl.hidden = true;
  setStatus("");
}

cityInput.addEventListener("change", handleCitySelection);
form.addEventListener("submit", handleSave);
clearBtn.addEventListener("click", handleClear);
