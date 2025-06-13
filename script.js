// API Keys
const WEATHER_API_KEY = '688cf61a433c15c2e11ece28547c63b8';
const NEWS_API_KEY = '7bad40454f724dc2a244277373be189f';

// API Base URLs
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const NEWS_BASE_URL = 'https://newsapi.org/v2';

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const cityInput = document.getElementById('city-input');
const weatherSearchBtn = document.getElementById('search-weather-btn');
const weatherContainer = document.getElementById('weather-container');
const newsInput = document.getElementById('news-input');
const newsSearchBtn = document.getElementById('search-news-btn');
const newsContainer = document.getElementById('news-container');

// Default values
const defaultCity = 'London';
const defaultNewsQuery = 'technology';

// Tab switching functionality
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(btn => btn.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// Weather Event Listeners
weatherSearchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    }
});

// News Event Listeners
newsSearchBtn.addEventListener('click', () => {
    const query = newsInput.value.trim() || defaultNewsQuery;
    fetchNewsData(query);
});

newsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = newsInput.value.trim() || defaultNewsQuery;
        fetchNewsData(query);
    }
});

// Fetch Weather Data
async function fetchWeatherData(city) {
    weatherContainer.innerHTML = '<div class="loading">Loading weather data...</div>';
    
    try {
        // Fetch current weather
        const currentResponse = await fetch(`${WEATHER_BASE_URL}/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`);
        if (!currentResponse.ok) {
            throw new Error('City not found');
        }
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(`${WEATHER_BASE_URL}/forecast?q=${city}&units=metric&appid=${WEATHER_API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentData, forecastData);
    } catch (error) {
        weatherContainer.innerHTML = `<div class="error">${error.message}. Please try another city.</div>`;
        console.error('Error fetching weather data:', error);
    }
}

// Display Weather Data
function displayWeatherData(currentData, forecastData) {
    // Process current weather
    const currentWeather = {
        city: currentData.name,
        country: currentData.sys.country,
        temp: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        wind: currentData.wind.speed,
        pressure: currentData.main.pressure,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString()
    };
    
    // Process forecast (group by day and take one reading per day)
    const dailyForecast = [];
    const daysAdded = new Set();
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!daysAdded.has(day)) {
            dailyForecast.push({
                day,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                icon: item.weather[0].icon
            });
            daysAdded.add(day);
        }
    });
    
    // Limit to 5 days
    const forecast = dailyForecast.slice(0, 5);
    
    // Generate HTML
    let html = `
        <div class="weather-display">
            <div class="current-weather">
                <h2>${currentWeather.city}, ${currentWeather.country}</h2>
                <div class="weather-info">
                    <img src="https://openweathermap.org/img/wn/${currentWeather.icon}@2x.png" alt="${currentWeather.description}" class="weather-icon">
                    <div class="temp">${currentWeather.temp}°C</div>
                    <div class="description">${currentWeather.description}</div>
                </div>
                <div class="details">
                    <div class="detail-item">
                        <div>Feels Like</div>
                        <div class="value">${currentWeather.feels_like}°C</div>
                    </div>
                    <div class="detail-item">
                        <div>Humidity</div>
                        <div class="value">${currentWeather.humidity}%</div>
                    </div>
                    <div class="detail-item">
                        <div>Wind</div>
                        <div class="value">${currentWeather.wind} m/s</div>
                    </div>
                    <div class="detail-item">
                        <div>Sunrise</div>
                        <div class="value">${currentWeather.sunrise}</div>
                    </div>
                    <div class="detail-item">
                        <div>Sunset</div>
                        <div class="value">${currentWeather.sunset}</div>
                    </div>
                </div>
            </div>
            
            <h3 style="width: 100%; text-align: center; margin-top: 30px;">5-Day Forecast</h3>
            <div class="forecast">
    `;
    
    forecast.forEach(day => {
        html += `
            <div class="forecast-card">
                <div class="day">${day.day}</div>
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" class="weather-icon">
                <div class="temp">${day.temp}°C</div>
                <div class="description">${day.description}</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    weatherContainer.innerHTML = html;
}

// Fetch News Data
async function fetchNewsData(query) {
    newsContainer.innerHTML = '<div class="loading">Loading news articles...</div>';
    
    try {
        const response = await fetch(`${NEWS_BASE_URL}/everything?q=${query}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            displayNewsData(data.articles);
        } else {
            throw new Error('No articles found');
        }
    } catch (error) {
        newsContainer.innerHTML = `<div class="error">${error.message}. Please try a different search term.</div>`;
        console.error('Error fetching news:', error);
    }
}

// Display News Data
function displayNewsData(articles) {
    let html = '<div class="news-container">';
    
    // Limit to 12 articles
    const limitedArticles = articles.slice(0, 12);
    
    limitedArticles.forEach(article => {
        html += `
            <div class="news-card">
                ${article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}" class="news-image" onerror="this.style.display='none'">` : ''}
                <div class="news-content">
                    <h3 class="news-title"><a href="${article.url}" target="_blank">${article.title}</a></h3>
                    <p class="news-description">${article.description || 'No description available'}</p>
                    <div class="news-source">
                        <span>${article.source.name || 'Unknown source'}</span>
                        <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    newsContainer.innerHTML = html;
}

// Initialize with default data
window.addEventListener('load', () => {
    fetchWeatherData(defaultCity);
    fetchNewsData(defaultNewsQuery);
});