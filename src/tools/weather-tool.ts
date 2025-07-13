import { z } from 'zod';
import { createTool } from '../tool-system';

// Input schema for the weather tool
const WeatherInputSchema = z.object({
    city: z.string().min(1, 'City name is required'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
});

// Mock weather data
const mockWeatherData: Record<string, any> = {
    'new york': {
        temperature: 22,
        condition: 'partly cloudy',
        humidity: 65,
        windSpeed: 12,
        location: 'New York, NY',
    },
    london: {
        temperature: 15,
        condition: 'rainy',
        humidity: 80,
        windSpeed: 8,
        location: 'London, UK',
    },
    tokyo: {
        temperature: 28,
        condition: 'sunny',
        humidity: 55,
        windSpeed: 6,
        location: 'Tokyo, Japan',
    },
    paris: {
        temperature: 18,
        condition: 'cloudy',
        humidity: 70,
        windSpeed: 10,
        location: 'Paris, France',
    },
    sydney: {
        temperature: 25,
        condition: 'sunny',
        humidity: 60,
        windSpeed: 14,
        location: 'Sydney, Australia',
    },
};

async function getWeather(input: z.infer<typeof WeatherInputSchema>) {
    const { city, units } = input;
    const cityKey = city.toLowerCase();

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!mockWeatherData[cityKey]) {
        // Return generic weather for unknown cities
        return {
            location: city,
            temperature: Math.floor(Math.random() * 30) + 10,
            condition: 'partly cloudy',
            humidity: Math.floor(Math.random() * 40) + 40,
            windSpeed: Math.floor(Math.random() * 20) + 5,
            units: units,
            note: 'Mock weather data for demonstration',
        };
    }

    const weather = mockWeatherData[cityKey];
    let temperature = weather.temperature;

    // Convert temperature if needed
    if (units === 'fahrenheit') {
        temperature = Math.round((temperature * 9) / 5 + 32);
    }

    return {
        location: weather.location,
        temperature: temperature,
        condition: weather.condition,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        units: units,
        note: 'Mock weather data for demonstration',
    };
}

export const weatherTool = createTool(
    'get_weather',
    'Get current weather information for a specific city. Returns temperature, conditions, humidity, and wind speed.',
    WeatherInputSchema,
    getWeather,
);
