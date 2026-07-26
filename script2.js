/**
 * TexelSense AI - Smart Comfort Simulator Engine
 * Refined Biophysical Physics & Multi-State Expression Engine.
 */

// Accurate Textile Biophysical Constants
// Clo: Insulation Value | Ret: Evaporative Resistance (m²Pa/W) | Hydrophobic Index (%)
const FABRIC_PROPERTIES = {
    Cotton:    { clo: 0.35, ret: 12.0, hydrophobic: 15, baseBreathability: 85 },
    Polyester: { clo: 0.40, ret: 25.0, hydrophobic: 80, baseBreathability: 35 },
    Wool:      { clo: 1.20, ret: 45.0, hydrophobic: 50, baseBreathability: 45 },
    Silk:      { clo: 0.25, ret: 10.0, hydrophobic: 20, baseBreathability: 75 },
    Linen:     { clo: 0.20, ret: 8.0,  hydrophobic: 10, baseBreathability: 95 },
    Denim:     { clo: 0.80, ret: 35.0, hydrophobic: 30, baseBreathability: 40 },
    Nylon:     { clo: 0.30, ret: 50.0, hydrophobic: 92, baseBreathability: 20 }
};

const GARMENT_MULTIPLIERS = {
    'T-Shirt': { coverage: 0.40, cloMult: 1.0 },
    'Shirt':   { coverage: 0.55, cloMult: 1.2 },
    'Hoodie':  { coverage: 0.85, cloMult: 2.3 },
    'Jacket':  { coverage: 0.95, cloMult: 3.1 }
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
    elements.fabricChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            elements.fabricChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            state.fabric = e.target.dataset.value;
            runSimulation();
        }
    });

    elements.weatherChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            elements.weatherChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            state.weather = e.target.dataset.value;
            applyWeatherPreset(state.weather);
            runSimulation();
        }
    });

    elements.selectGarment.addEventListener('change', (e) => {
        state.garment = e.target.value;
        updateGarmentSvg();
        runSimulation();
    });

    elements.pickerColor.addEventListener('input', (e) => {
        state.color = e.target.value;
        updateGarmentSvg();
    });

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

    elements.btnSimulate.addEventListener('click', runSimulation);
    elements.btnReset.addEventListener('click', resetSimulation);
    elements.btnRandomWeather.addEventListener('click', randomizeWeather);
    elements.btnExport.addEventListener('click', exportReport);
}

/* ==========================================================================
   Refined Biophysical Thermodynamic Simulation Engine
   ========================================================================== */
function runSimulation() {
    const fab = FABRIC_PROPERTIES[state.fabric];
    const garm = GARMENT_MULTIPLIERS[state.garment];

    // 1. Effective Insulation (Clo) & Ret Math
    const totalClo = fab.clo * garm.cloMult;
    const effectiveRet = fab.ret * garm.coverage;

    // Display Percentages
    const displayHeatRetention = Math.min(100, Math.round((totalClo / 3.5) * 100));
    const displayBreathability = Math.max(5, Math.min(100, Math.round(fab.baseBreathability / (garm.coverage * 1.15))));

    // 2. Environmental Apparent Temperature (Wind Chill & Humidity Impact)
    const windCooling = Math.sqrt(state.wind) * 0.75;
    const humidityHeatPenalty = (state.humidity > 50) ? ((state.humidity - 50) * 0.08) : 0;
    const apparentTemp = state.temperature - windCooling + humidityHeatPenalty;

    // 3. Equilibrium Skin Temperature Calculation
    // Neutral comfort skin temperature is ~33.5°C
    const thermalResistance = 0.155 * totalClo; // 1 Clo = 0.155 m²K/W
    const metabolicHeat = 65; // Resting metabolic rate W/m²
    
    // Skin Temp Estimation: T_skin = T_apparent + (M * R_total)
    const estimatedSkinTemp = apparentTemp + (metabolicHeat * (thermalResistance + 0.05));
    
    // Thermal Delta relative to physiological comfort neutrality (~33.5°C skin temp)
    const thermalDelta = estimatedSkinTemp - 33.5;

    // 4. Non-Linear Exponential Comfort Score Engine
    let comfort = 100;

    if (thermalDelta > 0) {
        // Hot side: Affected by high Ret (poor sweat evaporation) and high humidity
        const sweatPenalty = (effectiveRet / 10) * (state.humidity / 50);
        comfort -= Math.pow(thermalDelta, 1.85) * (1.2 + sweatPenalty * 0.1);
    } else {
        // Cold side: Wind chill and lack of clo insulation
        const coldSeverity = Math.abs(thermalDelta);
        comfort -= Math.pow(coldSeverity, 1.75) * (1.1 / (totalClo + 0.1));
    }

    // Rain Penalty Index
    if (state.weather === 'Rainy' && fab.hydrophobic < 50) {
        comfort -= (50 - fab.hydrophobic) * 1.1;
    }

    comfort = Math.max(0, Math.min(100, Math.round(comfort)));

    // 5. Precise Risk Score Calculation
    let risk = 2;
    if (thermalDelta < -10) risk += Math.abs(thermalDelta + 10) * 6; // Hypothermia Risk
    if (thermalDelta > 10) risk += (thermalDelta - 10) * 6.5;         // Heat Stroke / Exhaustion
    if (state.weather === 'Rainy' && fab.hydrophobic < 30) risk += 25; // Water saturation penalty
    risk = Math.max(2, Math.min(99, Math.round(risk)));

    // 6. Contextual Fashion Compatibility Score
    let fashion = 90;
    if (state.temperature >= 30 && ['Wool', 'Hoodie', 'Jacket'].includes(state.garment)) fashion -= 50;
    if (state.temperature <= 10 && ['Linen', 'Silk', 'T-Shirt'].includes(state.garment)) fashion -= 45;
    if (state.weather === 'Rainy' && state.fabric === 'Linen') fashion -= 30;
    fashion = Math.max(10, Math.min(99, Math.round(fashion)));

    // Update UI Elements
    updateMetricsUI({
        comfort,
        risk,
        fashion,
        breathability: displayBreathability,
        heatRetention: displayHeatRetention,
        thermalDelta,
        waterResistance: fab.hydrophobic
    });
}

function updateMetricsUI(results) {
    // Comfort Gauge Circle
    const offset = 314 - (314 * results.comfort) / 100;
    elements.gaugeComfort.style.strokeDashoffset = offset;
    elements.valComfortScore.textContent = results.comfort;

    // Mini Indicators
    elements.valBreathability.textContent = `${results.breathability}%`;
    elements.barBreathability.style.width = `${results.breathability}%`;

    elements.valHeatRetention.textContent = `${results.heatRetention}%`;
    elements.barHeatRetention.style.width = `${results.heatRetention}%`;

    // Analytics Dashboard
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

    // Biometric Avatar Engine Trigger
    applyBiometricState(results);

    // AI Recommendation Generator
    generateRecommendation(results);
}

/**
 * Biometric Expression Mapper Engine
 */
function applyBiometricState(res) {
    // Reset overlay elements
    elements.sweatGroup.classList.add('hidden');
    elements.coldGroup.classList.add('hidden');
    elements.wetGroup.classList.add('hidden');
    elements.characterWrapper.classList.remove('shivering');
    elements.headBase.setAttribute('fill', '#f3d2b3'); // Reset face base tone

    // 1. Extreme Heat & Overheating (Hot weather, high insulation, high delta)
    if (res.thermalDelta > 5.5 || (state.temperature >= 32 && res.comfort < 60)) {
        setAvatar('🥵', 'Overheating', 'Severe Heat Accumulation');
        elements.sweatGroup.classList.remove('hidden');
        elements.headBase.setAttribute('fill', '#fca5a5'); // Flushing skin
    } 
    // 2. Extreme Cold & Freezing (Low ambient temp, inadequate insulation)
    else if (res.thermalDelta < -5.5 || (state.temperature <= 10 && res.comfort < 60)) {
        setAvatar('🥶', 'Freezing', 'Thermal Heat Loss');
        elements.coldGroup.classList.remove('hidden');
        elements.characterWrapper.classList.add('shivering');
        elements.headBase.setAttribute('fill', '#dbeafe'); // Pale shivering skin
    } 
    // 3. Wet / Rain Impact
    else if (state.weather === 'Rainy' && res.waterResistance < 45) {
        setAvatar('🌧️', 'Soaked', 'High Water Ingress');
        elements.wetGroup.classList.remove('hidden');
    } 
    // 4. Relaxed State
    else if (res.comfort >= 80) {
        setAvatar('😎', 'Relaxed', 'Thermoregulation Neutral');
    } 
    // 5. Comfortable State
    else if (res.comfort >= 55) {
        setAvatar('😀', 'Comfortable', 'Microclimate Stable');
    } 
    // 6. Sub-optimal / Mild Discomfort State
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

    if (results.thermalDelta < -5.5) {
        icon = '❄️';
        title = 'Insulation Deficit';
        reason = `${state.fabric} ${state.garment} traps insufficient body heat in ${state.temperature}°C conditions. Switch to high-Clo fabrics like Wool or heavy outer layers (Hoodies/Jackets).`;
    } else if (results.thermalDelta > 5.5) {
        icon = '🔥';
        title = 'Overheating Warning';
        reason = `Excess thermal energy trapped under ${state.fabric} ${state.garment}. Choose highly breathable fabrics with low evaporative resistance like Linen or Cotton T-Shirts.`;
    } else if (state.weather === 'Rainy' && results.waterResistance < 45) {
        icon = '🌧️';
        title = 'Water Penetration Warning';
        reason = `${state.fabric} is moisture-absorbing and unsuited for rain. Upgrade to hydrophobic fabrics like Nylon or Polyester outer shells.`;
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
        state.temperature = 28;
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
