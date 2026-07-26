/**
 * TexelSense AI - Smart Comfort Simulator Engine
 * Refined Multi-State Expression Engine for TrebEdit/Android.
 */

// Fabric Thermal Properties Matrix
const FABRIC_PROPERTIES = {
    Cotton:    { breathability: 85, heatRetention: 30, waterResistance: 10 },
    Polyester: { breathability: 30, heatRetention: 55, waterResistance: 75 },
    Wool:      { breathability: 50, heatRetention: 95, waterResistance: 40 },
    Silk:      { breathability: 70, heatRetention: 35, waterResistance: 15 },
    Linen:     { breathability: 98, heatRetention: 10, waterResistance: 5  },
    Denim:     { breathability: 40, heatRetention: 65, waterResistance: 30 },
    Nylon:     { breathability: 20, heatRetention: 50, waterResistance: 90 }
};

const GARMENT_MULTIPLIERS = {
    'T-Shirt': { coverage: 0.4, insulation: 1.0 },
    'Shirt':   { coverage: 0.5, insulation: 1.1 },
    'Hoodie':  { coverage: 0.85, insulation: 2.2 },
    'Jacket':  { coverage: 0.95, insulation: 2.8 }
};

// Application State
const state = {
    fabric: 'Cotton',
    garment: 'T-Shirt',
    color: '#3b82f6',
    weather: 'Sunny',
    temperature: 25,
    humidity: 50,
    wind: 15
};

// DOM Registry
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    setupEventListeners();
    updateGarmentSvg();
    runSimulation();
});

function cacheElements() {
    elements = {
        // Left Panel outputs
        avatarFace: document.getElementById('avatarFace'),
        currentMood: document.getElementById('currentMood'),
        currentThermalState: document.getElementById('currentThermalState'),
        valComfortScore: document.getElementById('valComfortScore'),
        gaugeComfort: document.getElementById('gaugeComfort'),
        valBreathability: document.getElementById('valBreathability'),
        barBreathability: document.getElementById('barBreathability'),
        valHeatRetention: document.getElementById('valHeatRetention'),
        barHeatRetention: document.getElementById('barHeatRetention'),
        
        // Stage outputs
        stageBg: document.getElementById('stageBg'),
        particleContainer: document.getElementById('particleContainer'),
        garmentLayer: document.getElementById('garmentLayer'),
        characterWrapper: document.getElementById('characterWrapper'),
        headBase: document.getElementById('headBase'),
        sweatGroup: document.getElementById('sweatGroup'),
        coldGroup: document.getElementById('coldGroup'),
        wetGroup: document.getElementById('wetGroup'),
        stageGarmentLabel: document.getElementById('stageGarmentLabel'),

        // Controls
        fabricChips: document.getElementById('fabricChips'),
        selectGarment: document.getElementById('selectGarment'),
        pickerColor: document.getElementById('pickerColor'),
        weatherChips: document.getElementById('weatherChips'),
        sliderTemp: document.getElementById('sliderTemp'),
        sliderHumidity: document.getElementById('sliderHumidity'),
        sliderWind: document.getElementById('sliderWind'),
        valTemp: document.getElementById('valTemp'),
        valHumidity: document.getElementById('valHumidity'),
        valWind: document.getElementById('valWind'),

        // Action Buttons
        btnSimulate: document.getElementById('btnSimulate'),
        btnReset: document.getElementById('btnReset'),
        btnRandomWeather: document.getElementById('btnRandomWeather'),
        btnExport: document.getElementById('btnExport'),

        // Results Section
        valRiskScore: document.getElementById('valRiskScore'),
        badgeRisk: document.getElementById('badgeRisk'),
        valFashionScore: document.getElementById('valFashionScore'),
        badgeFashion: document.getElementById('badgeFashion'),
        recIcon: document.getElementById('recIcon'),
        recTitle: document.getElementById('recTitle'),
        recReason: document.getElementById('recReason')
    };
}

function setupEventListeners() {
    // Fabric Selection Chips
    elements.fabricChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            elements.fabricChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            state.fabric = e.target.dataset.value;
            runSimulation();
        }
    });

    // Weather Selection Chips
    elements.weatherChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            elements.weatherChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            state.weather = e.target.dataset.value;
            applyWeatherPreset(state.weather);
            runSimulation();
        }
    });

    // Select & Inputs
    elements.selectGarment.addEventListener('change', (e) => {
        state.garment = e.target.value;
        updateGarmentSvg();
        runSimulation();
    });

    elements.pickerColor.addEventListener('input', (e) => {
        state.color = e.target.value;
        updateGarmentSvg();
    });

    // Sliders
    elements.sliderTemp.addEventListener('input', (e) => {
        state.temperature = parseInt(e.target.value);
        elements.valTemp.textContent = `${state.temperature}°C`;
        runSimulation();
    });

    elements.sliderHumidity.addEventListener('input', (e) => {
        state.humidity = parseInt(e.target.value);
        elements.valHumidity.textContent = `${state.humidity}%`;
        runSimulation();
    });

    elements.sliderWind.addEventListener('input', (e) => {
        state.wind = parseInt(e.target.value);
        elements.valWind.textContent = `${state.wind} km/h`;
        runSimulation();
    });

    // Buttons
    elements.btnSimulate.addEventListener('click', runSimulation);
    elements.btnReset.addEventListener('click', resetSimulation);
    elements.btnRandomWeather.addEventListener('click', randomizeWeather);
    elements.btnExport.addEventListener('click', exportReport);
}

/* ==========================================================================
   Simulation Engine & Precise Biometric State Mapper
   ========================================================================== */
function runSimulation() {
    const fab = FABRIC_PROPERTIES[state.fabric];
    const garm = GARMENT_MULTIPLIERS[state.garment];

    // Effective insulation calculation
    const totalHeatRetention = Math.min(100, Math.round(fab.heatRetention * garm.insulation));
    const effectiveBreathability = Math.round(fab.breathability / (garm.coverage * 1.2));

    // Ideal warmth calculation (~22°C baseline)
    const idealTemp = 22 - (totalHeatRetention - 35) * 0.22;
    const thermalDelta = state.temperature - idealTemp;

    // Comfort score calculation
    let comfort = 100;

    if (thermalDelta > 0) {
        // Heat discomfort penalization
        comfort -= (thermalDelta * 3.4) * (1 - (effectiveBreathability / 150));
    } else {
        // Cold discomfort penalization
        comfort -= (Math.abs(thermalDelta) * 3.8) * (1 - (totalHeatRetention / 110));
    }

    if (state.weather === 'Rainy' && fab.waterResistance < 40) {
        comfort -= (40 - fab.waterResistance) * 0.8;
    }

    comfort = Math.max(5, Math.min(100, Math.round(comfort)));

    // Risk score calculation
    let risk = 5;
    if (thermalDelta < -12) risk += 65; // Freezing risk
    if (thermalDelta > 15) risk += 60;  // Heat exhaustion risk
    if (state.weather === 'Rainy' && fab.waterResistance < 20) risk += 35;
    risk = Math.max(2, Math.min(98, Math.round(risk)));

    // Fashion score calculation
    let fashion = 88;
    if (state.weather === 'Summer' && ['Wool', 'Hoodie', 'Jacket'].includes(state.garment)) fashion -= 45;
    if (state.weather === 'Winter' && ['Linen', 'Silk', 'T-Shirt'].includes(state.garment)) fashion -= 40;
    fashion = Math.max(10, Math.min(99, Math.round(fashion)));

    // Update UI Metrics
    updateMetricsUI({
        comfort,
        risk,
        fashion,
        breathability: effectiveBreathability,
        heatRetention: totalHeatRetention,
        thermalDelta,
        waterResistance: fab.waterResistance
    });
}

function updateMetricsUI(results) {
    // Comfort Gauge Circle Fill Update
    const offset = 314 - (314 * results.comfort) / 100;
    elements.gaugeComfort.style.strokeDashoffset = offset;
    elements.valComfortScore.textContent = results.comfort;

    // Mini Bars
    elements.valBreathability.textContent = `${results.breathability}%`;
    elements.barBreathability.style.width = `${Math.min(100, results.breathability)}%`;

    elements.valHeatRetention.textContent = `${results.heatRetention}%`;
    elements.barHeatRetention.style.width = `${results.heatRetention}%`;

    // Analytics Cards
    elements.valRiskScore.textContent = `${results.risk}%`;
    if (results.risk < 25) {
        elements.badgeRisk.className = 'score-badge badge-green';
        elements.badgeRisk.textContent = 'Low';
    } else if (results.risk < 60) {
        elements.badgeRisk.className = 'score-badge badge-red';
        elements.badgeRisk.textContent = 'Moderate';
    } else {
        elements.badgeRisk.className = 'score-badge badge-red';
        elements.badgeRisk.textContent = 'High Risk';
    }

    elements.valFashionScore.textContent = `${results.fashion}%`;

    // Multi-State Biometric Face & Visual Layering Matrix
    applyBiometricState(results);

    // Dynamic Recommendation System
    generateRecommendation(results);
}

/**
 * Maps simulation results to exact visual and emotional avatar states
 */
function applyBiometricState(res) {
    // Reset visual effects layers
    elements.sweatGroup.classList.add('hidden');
    elements.coldGroup.classList.add('hidden');
    elements.wetGroup.classList.add('hidden');
    elements.characterWrapper.classList.remove('shivering');
    elements.headBase.setAttribute('fill', '#f3d2b3'); // Reset face tone

    // 1. Cold State (Freezing / Low Insulation)
    if (res.thermalDelta < -6) {
        setAvatar('🥶', 'Freezing', 'Severe Thermal Heat Loss');
        elements.coldGroup.classList.remove('hidden');
        elements.characterWrapper.classList.add('shivering');
        elements.headBase.setAttribute('fill', '#dbeafe'); // Pale blue undertone
    } 
    // 2. Overheating State (Sweating / High Insulation / Hot Weather)
    else if (res.thermalDelta > 6 || (state.temperature > 32 && res.breathability < 50)) {
        setAvatar('🥵', 'Overheating', 'Excessive Thermal Trapping');
        elements.sweatGroup.classList.remove('hidden');
        elements.headBase.setAttribute('fill', '#fca5a5'); // Flush red undertone
    }
    // 3. Wet State (Rain Impact / Inappropriate Fabric)
    else if (state.weather === 'Rainy' && res.waterResistance < 40) {
        setAvatar('🌧️', 'Soaked', 'High Moisture Penetration');
        elements.wetGroup.classList.remove('hidden');
    }
    // 4. Relaxed State
    else if (res.comfort >= 85) {
        setAvatar('😎', 'Relaxed', 'Thermoregulation Optimal');
    }
    // 5. Comfortable State
    else if (res.comfort >= 70) {
        setAvatar('😀', 'Comfortable', 'Ideal Heat Dissipation');
    }
    // 6. Slightly Uncomfortable
    else {
        setAvatar('😐', 'Uneasy', 'Sub-optimal Microclimate');
    }
}

function setAvatar(emoji, mood, stateText) {
    elements.avatarFace.textContent = emoji;
    elements.currentMood.textContent = mood;
    elements.currentThermalState.textContent = stateText;
}

function generateRecommendation(results) {
    let icon = '💡';
    let title = 'Optimal Textile Pairing';
    let reason = `${state.fabric} ${state.garment} provides a balanced microclimate for ${state.temperature}°C ${state.weather.toLowerCase()} conditions.`;

    if (results.thermalDelta < -6) {
        icon = '❄️';
        title = 'Insulation Deficit';
        reason = `${state.fabric} ${state.garment} is under-insulated for ${state.temperature}°C weather. Switch to Wool, Hoodies, or Jackets to prevent hypothermia risk.`;
    } else if (results.thermalDelta > 6) {
        icon = '🔥';
        title = 'Overheating Risk';
        reason = `Excess heat trapped under ${state.fabric} ${state.garment}. Light fabrics like Linen or Cotton T-Shirts are strongly recommended.`;
    } else if (state.weather === 'Rainy' && results.waterResistance < 40) {
        icon = '🌧️';
        title = 'Inadequate Water Protection';
        reason = `${state.fabric} easily absorbs water in rainy conditions. Switch to Nylon or Polyester outer shells.`;
    }

    elements.recIcon.textContent = icon;
    elements.recTitle.textContent = title;
    elements.recReason.textContent = reason;
}

/* ==========================================================================
   Visual & Stage Controllers
   ========================================================================== */
function updateGarmentSvg() {
    elements.stageGarmentLabel.textContent = `${state.fabric} ${state.garment}`;
    
    let svgPath = '';
    const col = state.color;

    if (state.garment === 'T-Shirt') {
        svgPath = `
            <path d="M65 100 L135 100 L155 125 L140 140 L130 130 L130 190 L70 190 L70 130 L60 140 L45 125 Z" fill="${col}" />
            <path d="M85 100 Q100 115 115 100" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="3" />
        `;
    } else if (state.garment === 'Shirt') {
        svgPath = `
            <path d="M65 100 L135 100 L155 125 L140 140 L130 130 L130 195 L70 195 L70 130 L60 140 L45 125 Z" fill="${col}" />
            <line x1="100" y1="100" x2="100" y2="195" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
            <circle cx="100" cy="120" r="2" fill="#fff" />
            <circle cx="100" cy="145" r="2" fill="#fff" />
            <circle cx="100" cy="170" r="2" fill="#fff" />
        `;
    } else if (state.garment === 'Hoodie') {
        svgPath = `
            <path d="M60 95 L140 95 L160 155 L140 160 L135 140 L135 200 L65 200 L65 140 L60 160 L40 155 Z" fill="${col}" />
            <path d="M75 95 Q100 70 125 95" fill="none" stroke="${col}" stroke-width="12" />
            <path d="M80 160 Q100 160 120 160 L120 190 L80 190 Z" fill="rgba(0,0,0,0.15)" />
        `;
    } else if (state.garment === 'Jacket') {
        svgPath = `
            <path d="M55 95 L145 95 L165 160 L145 165 L135 140 L135 205 L65 205 L65 140 L55 165 L35 160 Z" fill="${col}" />
            <line x1="100" y1="95" x2="100" y2="205" stroke="rgba(0,0,0,0.4)" stroke-width="3" />
            <path d="M70 95 L100 125 L130 95" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="3" />
        `;
    }

    elements.garmentLayer.innerHTML = svgPath;
}

function applyWeatherPreset(preset) {
    elements.stageBg.className = `stage-background weather-${preset.toLowerCase()}`;
    elements.particleContainer.innerHTML = '';

    if (preset === 'Sunny') {
        state.temperature = 30;
        state.humidity = 40;
        state.wind = 10;
    } else if (preset === 'Rainy') {
        state.temperature = 18;
        state.humidity = 90;
        state.wind = 25;
        createParticles('weather-drop', 30);
    } else if (preset === 'Cloudy') {
        state.temperature = 20;
        state.humidity = 60;
        state.wind = 15;
    } else if (preset === 'Winter') {
        state.temperature = 2;
        state.humidity = 70;
        state.wind = 30;
        createParticles('weather-flake', 25);
    } else if (preset === 'Summer') {
        state.temperature = 42;
        state.humidity = 35;
        state.wind = 5;
    }

    // Sync Slider Inputs
    elements.sliderTemp.value = state.temperature;
    elements.valTemp.textContent = `${state.temperature}°C`;
    
    elements.sliderHumidity.value = state.humidity;
    elements.valHumidity.textContent = `${state.humidity}%`;

    elements.sliderWind.value = state.wind;
    elements.valWind.textContent = `${state.wind} km/h`;
}

function createParticles(className, count) {
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = className;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `-${Math.random() * 20}px`;
        p.style.animationDuration = `${0.8 + Math.random() * 1.5}s`;
        p.style.animationDelay = `${Math.random() * 2}s`;
        elements.particleContainer.appendChild(p);
    }
}

/* ==========================================================================
   Utility Actions
   ========================================================================== */
function randomizeWeather() {
    const presets = ['Sunny', 'Rainy', 'Cloudy', 'Winter', 'Summer'];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    
    elements.weatherChips.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c.dataset.value === randomPreset);
    });

    state.weather = randomPreset;
    applyWeatherPreset(randomPreset);
    runSimulation();
}

function resetSimulation() {
    state.fabric = 'Cotton';
    state.garment = 'T-Shirt';
    state.color = '#3b82f6';
    state.weather = 'Sunny';

    elements.fabricChips.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c.dataset.value === 'Cotton');
    });

    elements.weatherChips.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c.dataset.value === 'Sunny');
    });

    elements.selectGarment.value = 'T-Shirt';
    elements.pickerColor.value = '#3b82f6';

    updateGarmentSvg();
    applyWeatherPreset('Sunny');
    runSimulation();
}

function exportReport() {
    window.print();
}
