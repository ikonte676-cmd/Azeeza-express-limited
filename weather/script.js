// Configuration API OpenWeatherMap
const API_KEY = '5d5e34aca77a77e72b7c2f3df0ad3d27'; // Clé API gratuite
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// Éléments du DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherContainer = document.getElementById('weatherContainer');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Événements
searchBtn.addEventListener('click', searchWeather);
locationBtn.addEventListener('click', getLocationWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

/**
 * Effectue une recherche météo par ville
 */
async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Veuillez entrer le nom d\'une ville!');
        return;
    }
    await getWeatherByCity(city);
}

/**
 * Récupère la météo de l'utilisateur via géolocalisation
 */
function getLocationWeather() {
    if (!navigator.geolocation) {
        showError('La géolocalisation n\'est pas supportée par votre navigateur.');
        return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await getWeatherByCoords(latitude, longitude);
        },
        (error) => {
            showError('Impossible d\'accéder à votre localisation. ' + error.message);
        }
    );
}

/**
 * Récupère les coordonnées d'une ville
 */
async function getCoordinates(city) {
    try {
        const response = await fetch(
            `${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
        );
        const data = await response.json();

        if (!data || data.length === 0) {
            showError(`Ville "${city}" non trouvée. Veuillez vérifier l'orthographe.`);
            return null;
        }

        return {
            lat: data[0].lat,
            lon: data[0].lon,
            name: data[0].name,
            country: data[0].country
        };
    } catch (error) {
        showError('Erreur lors de la recherche de coordonnées: ' + error.message);
        return null;
    }
}

/**
 * Récupère la météo par ville
 */
async function getWeatherByCity(city) {
    const coords = await getCoordinates(city);
    if (!coords) return;

    await getWeatherByCoords(coords.lat, coords.lon);
}

/**
 * Récupère la météo par coordonnées (latitude, longitude)
 */
async function getWeatherByCoords(lat, lon) {
    showLoading();
    hideError();

    try {
        // Récupère la météo actuelle et les prévisions
        const currentResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${API_KEY}`
        );
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${API_KEY}`
        );

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Impossible de récupérer les données météo');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        displayWeather(currentData);
        displayForecast(forecastData);
        cityInput.value = '';
        hideLoading();
        emptyState.classList.add('hidden');
    } catch (error) {
        showError('Erreur: ' + error.message);
        hideLoading();
    }
}

/**
 * Affiche la météo actuelle
 */
function displayWeather(data) {
    const {
        name,
        sys: { country, sunrise, sunset },
        main: { temp, feels_like, humidity, pressure },
        weather: [{ main, description, icon }],
        wind: { speed, deg },
        visibility,
        clouds: { all: cloudiness }
    } = data;

    // En-tête
    document.getElementById('cityName').textContent = `${name}, ${country}`;
    document.getElementById('lastUpdated').textContent = `Mis à jour: ${new Date().toLocaleTimeString('fr-FR')}`;

    // Icône et température
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
    document.getElementById('temperature').textContent = `${Math.round(temp)}°C`;
    document.getElementById('description').textContent = capitalizeFirstLetter(description);

    // Détails
    document.getElementById('feelsLike').textContent = `${Math.round(feels_like)}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;
    document.getElementById('windSpeed').textContent = `${(speed * 3.6).toFixed(1)} km/h`; // m/s to km/h
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('uvIndex').textContent = `${cloudiness}% nuageux`;

    // Lever/Coucher du soleil
    document.getElementById('sunrise').textContent = new Date(sunrise * 1000).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('sunset').textContent = new Date(sunset * 1000).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Direction du vent
    document.getElementById('windDirection').textContent = `${getWindDirection(deg)} (${deg}°)`;

    // Chance de pluie (approximation basée sur la couverture nuageuse)
    document.getElementById('rainChance').textContent = `${cloudiness}%`;

    weatherContainer.classList.remove('hidden');
}

/**
 * Affiche les prévisions sur 5 jours
 */
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    // Récupère un prévision tous les jours (toutes les 8 prévisions = 24h)
    const dailyForecasts = {};

    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('fr-FR');

        if (!dailyForecasts[day]) {
            dailyForecasts[day] = forecast;
        }
    });

    // Affiche les 5 prochains jours
    Object.values(dailyForecasts).slice(0, 5).forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
        const { main: { temp_max, temp_min }, weather: [{ icon, description }] } = forecast;

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="forecast-icon">
            <div class="forecast-temp">${Math.round(temp_max)}°C / ${Math.round(temp_min)}°C</div>
            <div class="forecast-desc">${capitalizeFirstLetter(description)}</div>
        `;
        forecastContainer.appendChild(card);
    });
}

/**
 * Convertit la direction du vent en cardinal
 */
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees + 11.25) % 360) / 22.5);
    return directions[index];
}

/**
 * Met en majuscule la première lettre
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Affiche le spinner de chargement
 */
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
}

/**
 * Cache le spinner de chargement
 */
function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

/**
 * Affiche un message d'erreur
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    hideLoading();
    weatherContainer.classList.add('hidden');
}

/**
 * Cache le message d'erreur
 */
function hideError() {
    errorMessage.classList.add('hidden');
}