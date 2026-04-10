const axios = require('axios');

// Weather API proxy
exports.getWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    if (!lat && !lon && !city) {
      return res.status(400).json({ 
        message: 'Please provide either lat/lon or city name' 
      });
    }

    let weatherUrl;
    
    if (lat && lon) {
      weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${process.env.OPENWEATHER_API_KEY}&q=${lat},${lon}`;
    } else if (city) {
      weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${process.env.OPENWEATHER_API_KEY}&q=${city}`;
    }

    const response = await axios.get(weatherUrl);
    
    // Transform WeatherAPI.com response
    const weatherData = {
      location: response.data.location.name,
      temperature: Math.round(response.data.current.temp_c),
      feelsLike: Math.round(response.data.current.feelslike_c),
      humidity: response.data.current.humidity,
      windSpeed: response.data.current.wind_kph,
      description: response.data.current.condition.text,
      icon: `https:${response.data.current.condition.icon}`,
      main: response.data.current.condition.text
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to fetch weather data' 
    });
  }
};

// AI-based fair price suggestion
exports.getPriceSuggestion = async (req, res) => {
  try {
    const {
      productCategory,
      avgMarketPrice,
      quantityAvailable,
      shelfLifeDays,
      distanceToBuyerKm = 0,
      season = 'normal'
    } = req.body;

    // Simple heuristic pricing
    const supplyFactor = Math.max(0.85, Math.min(1.2, 1 - (quantityAvailable / 200)));
    const distanceFactor = 1 + (distanceToBuyerKm > 50 ? 0.05 : 0);
    const shelfLifeFactor = shelfLifeDays < 3 ? 0.9 : 
                           shelfLifeDays < 7 ? 0.95 : 1.0;
    
    const seasonFactors = { peak: 1.2, normal: 1.0, low: 0.8 };
    const seasonFactor = seasonFactors[season] || 1.0;

    const suggestedPrice = avgMarketPrice * supplyFactor * distanceFactor * shelfLifeFactor * seasonFactor;
    const roundedPrice = Math.round(suggestedPrice * 100) / 100;

    res.json({
      suggestedPrice: roundedPrice,
      factors: {
        supplyFactor: Math.round(supplyFactor * 100) / 100,
        distanceFactor: Math.round(distanceFactor * 100) / 100,
        shelfLifeFactor: Math.round(shelfLifeFactor * 100) / 100,
        seasonFactor: Math.round(seasonFactor * 100) / 100
      }
    });

  } catch (error) {
    console.error('Price suggestion error:', error);
    res.status(500).json({ 
      message: 'Error generating price suggestion' 
    });
  }
};

// Simple AI Crop Price Prediction Model
exports.predictCropPrice = async (req, res) => {
  try {
    const { crop, region = 'General', currentPrice } = req.body;

    if (!crop) {
      return res.status(400).json({ message: 'Crop name is required' });
    }

    // Heuristic Database for AI Simulation
    const cropData = {
      'Tomato': { basePrice: 25, unit: 'kg', volatility: 0.3, seasonalFactors: [0.8, 1.2, 1.5, 1.1, 0.9, 0.7, 0.8, 1.0, 1.3, 1.4, 1.1, 0.9] },
      'Onion': { basePrice: 30, unit: 'kg', volatility: 0.4, seasonalFactors: [1.0, 1.0, 1.2, 1.4, 1.5, 1.6, 1.3, 1.1, 1.0, 1.1, 1.3, 1.2] },
      'Potato': { basePrice: 20, unit: 'kg', volatility: 0.15, seasonalFactors: [1.0, 1.1, 1.2, 1.0, 0.9, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9] },
      'Mango': { basePrice: 80, unit: 'kg', volatility: 0.5, seasonalFactors: [0.5, 0.6, 0.8, 1.2, 1.8, 2.0, 1.5, 0.8, 0.6, 0.5, 0.5, 0.5] },
      'Rice': { basePrice: 45, unit: 'kg', volatility: 0.1, seasonalFactors: [1.0, 1.0, 1.0, 1.0, 1.1, 1.1, 1.1, 1.0, 1.0, 1.1, 1.2, 1.1] },
      'Wheat': { basePrice: 35, unit: 'kg', volatility: 0.1, seasonalFactors: [1.1, 1.2, 1.3, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.1] },
      'Spinach': { basePrice: 15, unit: 'bunch', volatility: 0.2, seasonalFactors: [1.2, 1.1, 1.0, 0.8, 0.7, 0.7, 0.9, 1.0, 1.1, 1.2, 1.3, 1.3] },
      'Apple': { basePrice: 120, unit: 'kg', volatility: 0.2, seasonalFactors: [1.2, 1.3, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 1.0, 1.1, 1.2, 1.2] },
    };

    const currentMonth = new Date().getMonth();
    const normalizedCrop = Object.keys(cropData).find(k => k.toLowerCase() === crop.toLowerCase()) || 'Tomato';
    const data = cropData[normalizedCrop] || cropData['Tomato'];

    // Calculation Logic
    const basePrice = data.basePrice;
    const seasonalFactor = data.seasonalFactors[currentMonth];
    
    // Random market trend (Simulating AI discovery of current market state)
    const trend = (Math.random() * 0.2) - 0.1; // -10% to +10%
    
    const predictedPrice = basePrice * seasonalFactor * (1 + trend);
    const minRange = predictedPrice * 0.92;
    const maxRange = predictedPrice * 1.08;

    // Insights Generation
    const insights = [
      `Current demand for ${normalizedCrop} is ${trend > 0 ? 'increasing' : 'stable'} in ${region}.`,
      `Seasonal factors are contributing to a ${seasonalFactor > 1 ? 'premium' : 'reduced'} price point.`,
      `Market volatility for this crop is ${data.volatility > 0.3 ? 'High' : 'Moderate'}.`
    ];

    res.json({
      crop: normalizedCrop,
      unit: data.unit,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      minPrice: Math.round(minRange * 100) / 100,
      maxPrice: Math.round(maxRange * 100) / 100,
      confidence: Math.round((1 - data.volatility) * 100),
      insights,
      forecast: data.seasonalFactors.slice(currentMonth, currentMonth + 3).map((f, i) => ({
        month: new Date(new Date().setMonth(currentMonth + i)).toLocaleString('default', { month: 'short' }),
        trend: f > seasonalFactor ? 'rising' : 'falling'
      }))
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Error generating crop prediction' });
  }
};