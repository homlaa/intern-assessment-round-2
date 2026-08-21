const form = document.getElementById("registrationForm");
const status = document.getElementById("status");
const weather = document.getElementById("weather");
const clearBtn = document.getElementById("clearBtn");

async function getWeather(city) {
  try {
    // Get the city's coordinates
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`
    );

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found");
    }

    const latitude = geoData.results[0].latitude;
    const longitude = geoData.results[0].longitude;

    // Get weather using the coordinates
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );

    const weatherData = await weatherResponse.json();

    const temperature = weatherData.current_weather.temperature;
    const windspeed = weatherData.current_weather.windspeed;

    weather.innerHTML = `
      <p>Temperature: ${temperature} °C</p>
      <p>Windspeed: ${windspeed} km/h</p>
    `;

    return { latitude, longitude };

  } catch (error) {
    throw error;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const birthdate = document.getElementById("birthdate").value;
  const city = document.getElementById("city").value.trim();

  if (!firstName || !lastName || !birthdate || !city) {
    status.textContent = "Please fill in all fields.";
    return;
  }

  try {
    const location = await getWeather(city);

    const response = await fetch("http://localhost:3000/api/attendees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName,
        lastName,
        birthdate,
        city,
        latitude: location.latitude,
        longitude: location.longitude
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    status.textContent = "Registration successful!";

  } catch (error) {
    status.textContent = error.message;
    weather.innerHTML = "";
  }
});

clearBtn.addEventListener("click", () => {
  form.reset();
  status.textContent = "";
  weather.innerHTML = "";
});