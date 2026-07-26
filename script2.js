/**
 * TexelSense AI - Ultra-Fast Matrix Interpolation Comfort Engine
 * Optimized for High-Performance Real-Time UI Responsiveness
 * Anime Vector Avatar & Dynamic Clothing Module Included
 */

// 1. Empirical Fabric Clo & Resistance Matrix
const FABRICS = {
    Cotton:    { clo: 0.35, ret: 12, hydrophobic: 15, breathability: 85 },
    Polyester: { clo: 0.40, ret: 26, hydrophobic: 80, breathability: 35 },
    Wool:      { clo: 1.20, ret: 45, hydrophobic: 45, breathability: 45 },
    Silk:      { clo: 0.25, ret: 10, hydrophobic: 20, breathability: 75 },
    Linen:     { clo: 0.20, ret: 8,  hydrophobic: 10, breathability: 95 },
    Denim:     { clo: 0.80, ret: 35, hydrophobic: 30, breathability: 40 },
    Nylon:     { clo: 0.30, ret: 50, hydrophobic: 92, breathability: 20 }
};

const GARMENTS = {
    'T-Shirt': { cloMult: 1.0, coverage: 0.40 },
    'Shirt':   { cloMult: 1.3, coverage: 0.55 },
    'Hoodie':  { cloMult: 2.4, coverage: 0.85 },
    'Jacket':  { cloMult: 3.2, coverage: 0.95 }
};

// 2. Ideal Thermal Envelope (Clo required vs Temperature in °C)
// Based on empirical ASHRAE 55 neutral thermal comfort zone
function getTargetClo(temp) {
    if (temp <= 0)  return 3.5;
    if (temp <= 10) return 2.5;
    if (temp <= 18) return 1.5;
    if (temp <= 22) return 0.8;
    if (temp <= 26) return 0.4;
    if (temp <= 30) return 0.2;
    return 0.1; // > 30°C extreme heat
}

// State
const state = {
    fabric: 'Cotton',
    garment: 'T-Shirt',
    color: '#3b82f6',
    weather: 'Sunny',
    temperature: 25,
    humidity: 50,
    wind: 15
};

let elements = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    setupEventListeners();
    updateGarmentSvg();
    runSimulation();
});

function cacheElements() {
    elements = {
        avatarFace: document.getElementById('avatarFace'),
        currentMood: document.getElementById('currentMood'),
        currentThermalState: document.getElementById('currentThermalState'),
        valComfortScore: document.getElementById('valComfortScore'),
        gaugeComfort: document.getElementById('gaugeComfort'),
        valBreathability: document.getElementById('valBreathability'),
        barBreathability: document.getElementById('barBreathability'),
        valHeatRetention: document.getElementById('valHeatRetention'),
        barHeatRetention: document.getElementById('barHeatRetention'),
        stageBg: document.getElementById('stageBg'),
        particleContainer: document.getElementById('particleContainer'),
        garmentLayer: document.getElementById('garmentLayer'),
        characterWrapper: document.getElementById('characterWrapper'),
        headBase: document.getElementById('headBase'),
        sweatGroup: document.getElementById('sweatGroup'),
        coldGroup: document.getElementById('coldGroup'),
        wetGroup: document.getElementById('wetGroup'),
        stageGarmentLabel: document.getElementById('stageGarmentLabel'),
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
        btnSimulate: document.getElementById('btnSimulate'),
        btnReset: document.getElementById('btnReset'),
        btnRandomWeather: document.getElementById('btnRandomWeather'),
        btnExport: document.getElementById('btnExport'),
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
   Fast Matrix Interpolation Simulation Core
   ========================================================================== */
function runSimulation() {
    const fab = FABRICS[state.fabric];
    const garm = GARMENTS[state.garment];

    // 1. Calculate Actual Clothing Insulation (Clo)
    const currentClo = fab.clo * garm.cloMult;

    // 2. Apparent Temperature (Wind Chill + Humidity Index)
    const windEffect = (state.wind / 10) * 1.2;
    const humidityEffect = (state.humidity > 50) ? ((state.humidity - 50) * 0.12) : 0;
    const apparentTemp = state.temperature - windEffect + humidityEffect;

    // 3. Ideal Clo for Apparent Temperature
    const targetClo = getTargetClo(apparentTemp);

    // 4. Clo Delta (Positive = Over-insulated/Hot | Negative = Under-insulated/Cold)
    const cloDelta = currentClo - targetClo;

    // 5. Non-Linear Comfort Penalty Engine
    let comfort = 100;

    if (cloDelta > 0) {
        // OVERHEATING: Heavy clothing in mild/hot weather (e.g., Hoodie/Jacket at 25°C+)
        const heatPenalty = cloDelta * 42; 
        const humidityStifling = 1 + ((state.humidity / 100) * (fab.ret / 20));
        comfort -= heatPenalty * humidityStifling;
    } else {
        // FREEZING: Light clothing in cold weather
        const coldPenalty = Math.abs(cloDelta) * 35;
        const windPenalty = 1 + (state.wind / 30);
        comfort -= coldPenalty * windPenalty;
    }

    // Rain Penalty
    if (state.weather === 'Rainy' && fab.hydrophobic < 50) {
        comfort -= (50 - fab.hydrophobic) * 1.2;
    }

    comfort = Math.max(0, Math.min(100, Math.round(comfort)));

    // 6. Risk Score Logic
    let risk = 2;
    if (cloDelta > 1.2) risk += (cloDelta - 1.2) * 45;      // Heat exhaustion
    if (cloDelta < -1.5) risk += (Math.abs(cloDelta) - 1.5) * 40; // Hypothermia
    if (state.weather === 'Rainy' && fab.hydrophobic < 25) risk += 35;
    risk = Math.max(2, Math.min(99, Math.round(risk)));

    // 7. Display Bar Metrics
    const heatRetention = Math.min(100, Math.round((currentClo / 3.0) * 100));
    const breathability = Math.max(5, Math.min(100, Math.round(fab.breathability / (garm.coverage * 1.1))));

    // Fashion Appropriateness
    let fashion = 90;
    if (state.temperature >= 22 && ['Hoodie', 'Jacket'].includes(state.garment)) fashion -= 55;
    if (state.temperature <= 14 && ['Linen', 'Silk', 'T-Shirt'].includes(state.garment)) fashion -= 50;
    fashion = Math.max(5, Math.min(99, Math.round(fashion)));

    updateMetricsUI({
        comfort,
        risk,
        fashion,
        breathability,
        heatRetention,
        cloDelta,
        waterResistance: fab.hydrophobic
    });
}

function updateMetricsUI(res) {
    const offset = 314 - (314 * res.comfort) / 100;
    elements.gaugeComfort.style.strokeDashoffset = offset;
    elements.valComfortScore.textContent = res.comfort;

    elements.valBreathability.textContent = `${res.breathability}%`;
    elements.barBreathability.style.width = `${res.breathability}%`;

    elements.valHeatRetention.textContent = `${res.heatRetention}%`;
    elements.barHeatRetention.style.width = `${res.heatRetention}%`;

    elements.valRiskScore.textContent = `${res.risk}%`;
    if (res.risk < 25) {
        elements.badgeRisk.className = 'score-badge badge-green';
        elements.badgeRisk.textContent = 'Low';
    } else if (res.risk < 60) {
        elements.badgeRisk.className = 'score-badge badge-red';
        elements.badgeRisk.textContent = 'Moderate';
    } else {
        elements.badgeRisk.className = 'score-badge badge-red';
        elements.badgeRisk.textContent = 'High Risk';
    }

    elements.valFashionScore.textContent = `${res.fashion}%`;

    applyBiometricState(res);
    generateRecommendation(res);
}

/**
 * Maps simulation biometrics to Anime Expression Vectors & Skin Tones
 */
function applyBiometricState(res) {
    // Reset Overlays
    if (elements.sweatGroup) elements.sweatGroup.classList.add('hidden');
    if (elements.coldGroup) elements.coldGroup.classList.add('hidden');
    if (elements.wetGroup) elements.wetGroup.classList.add('hidden');
    if (elements.characterWrapper) elements.characterWrapper.classList.remove('shivering');
    
    // Default Anime Skin Tone
    if (elements.headBase) elements.headBase.setAttribute('fill', '#ffe4d6');

    // 1. Overheating Expression State (Flushed cheek blush + sweat)
    if (res.cloDelta > 0.6 || (state.temperature >= 24 && ['Hoodie', 'Jacket'].includes(state.garment))) {
        setAvatar('🥵', 'Overheating', 'Excess Thermal Trapping');
        if (elements.sweatGroup) elements.sweatGroup.classList.remove('hidden');
        if (elements.headBase) elements.headBase.setAttribute('fill', '#ffb8b8'); // Thermal skin flush
    } 
    // 2. Freezing Expression State (Hypothermic pale face + cold lines)
    else if (res.cloDelta < -0.6 || (state.temperature <= 12 && res.comfort < 50)) {
        setAvatar('🥶', 'Freezing', 'Severe Thermal Deficit');
        if (elements.coldGroup) elements.coldGroup.classList.remove('hidden');
        if (elements.characterWrapper) elements.characterWrapper.classList.add('shivering');
        if (elements.headBase) elements.headBase.setAttribute('fill', '#cbe2fe'); // Cold blue skin
    } 
    // 3. Wet/Soaked State
    else if (state.weather === 'Rainy' && res.waterResistance < 45) {
        setAvatar('🌧️', 'Soaked', 'High Water Penetration');
        if (elements.wetGroup) elements.wetGroup.classList.remove('hidden');
    } 
    // 4. Relaxed State
    else if (res.comfort >= 80) {
        setAvatar('😎', 'Relaxed', 'Thermoregulation Neutral');
    } 
    // 5. Comfortable State
    else if (res.comfort >= 55) {
        setAvatar('😀', 'Comfortable', 'Microclimate Stable');
    } 
    // 6. Uneasy State
    else {
        setAvatar('😐', 'Uneasy', 'Sub-optimal Microclimate');
    }
}

function setAvatar(emoji, mood, stateText) {
    elements.avatarFace.textContent = emoji;
    elements.currentMood.textContent = mood;
    elements.currentThermalState.textContent = stateText;
}

function generateRecommendation(res) {
    let icon = '💡';
    let title = 'Optimal Textile Pairing';
    let reason = `${state.fabric} ${state.garment} provides a balanced microclimate for ${state.temperature}°C conditions.`;

    if (res.cloDelta > 0.6 || (state.temperature >= 24 && ['Hoodie', 'Jacket'].includes(state.garment))) {
        icon = '🔥';
        title = 'Overheating Risk';
        reason = `${state.garment} traps too much heat at ${state.temperature}°C. Switch to light T-Shirts in Linen or Cotton.`;
    } else if (res.cloDelta < -0.6) {
        icon = '❄️';
        title = 'Insulation Deficit';
        reason = `${state.fabric} ${state.garment} lacks necessary thermal insulation for ${state.temperature}°C conditions. Upgrade to Wool, Hoodies, or Jackets.`;
    } else if (state.weather === 'Rainy' && res.waterResistance < 45) {
        icon = '🌧️';
        title = 'Water Penetration Warning';
        reason = `${state.fabric} absorbs rainwater quickly. Switch to hydrophobic fabrics like Nylon or Polyester.`;
    }

    elements.recIcon.textContent = icon;
    elements.recTitle.textContent = title;
    elements.recReason.textContent = reason;
}

/* ==========================================================================
   Anime Garment Render Engine
   ========================================================================== */
function updateGarmentSvg() {
    elements.stageGarmentLabel.textContent = `${state.fabric} ${state.garment}`;
    const col = state.color;
    let garmentPath = '';

    // Precise SVG paths tailored to fit the anime base character proportions
    if (state.garment === 'T-Shirt') {
        garmentPath = `
            <!-- Anime T-Shirt Base -->
            <path d="M68 118 Q100 128 132 118 L155 142 L140 162 L128 152 L128 215 L72 215 L72 152 L60 162 L45 142 Z" fill="${col}" stroke="#1e293b" stroke-width="2.5" />
            <!-- Anime Neckline Collar -->
            <path d="M82 118 Q100 132 118 118" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="3" />
            <path d="M82 118 Q100 132 118 118" fill="none" stroke="#1e293b" stroke-width="1.5" />
        `;
    } else if (state.garment === 'Shirt') {
        garmentPath = `
            <!-- Anime Button-up Shirt -->
            <path d="M68 116 Q100 126 132 116 L158 140 L142 162 L128 150 L128 218 L72 218 L72 150 L58 162 L42 140 Z" fill="${col}" stroke="#1e293b" stroke-width="2.5" />
            <!-- Anime Collar Fold Highlights -->
            <polygon points="80,116 100,136 72,132" fill="#ffffff" opacity="0.3" />
            <polygon points="120,116 100,136 128,132" fill="#ffffff" opacity="0.3" />
            <polygon points="80,116 100,136 72,132" fill="none" stroke="#1e293b" stroke-width="1.5" />
            <polygon points="120,116 100,136 128,132" fill="none" stroke="#1e293b" stroke-width="1.5" />
            <!-- Button Placket -->
            <line x1="100" y1="134" x2="100" y2="218" stroke="rgba(0,0,0,0.3)" stroke-width="2" />
            <circle cx="100" cy="150" r="2.5" fill="#ffffff" stroke="#1e293b" stroke-width="1" />
            <circle cx="100" cy="175" r="2.5" fill="#ffffff" stroke="#1e293b" stroke-width="1" />
            <circle cx="100" cy="200" r="2.5" fill="#ffffff" stroke="#1e293b" stroke-width="1" />
        `;
    } else if (state.garment === 'Hoodie') {
        garmentPath = `
            <!-- Anime Oversized Hoodie -->
            <path d="M62 112 Q100 122 138 112 L165 160 L145 172 L134 150 L134 222 L66 222 L66 150 L55 172 L35 160 Z" fill="${col}" stroke="#1e293b" stroke-width="2.5" />
            <!-- Hood Structure Behind Neck -->
            <path d="M72 112 Q100 85 128 112 Q100 135 72 112 Z" fill="${col}" stroke="#1e293b" stroke-width="2" />
            <!-- Drawstrings -->
            <path d="M90 126 Q88 150 85 165" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
            <path d="M110 126 Q112 150 115 165" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
            <!-- Kangaroo Pocket -->
            <path d="M78 175 L122 175 L126 212 L74 212 Z" fill="rgba(0,0,0,0.12)" stroke="#1e293b" stroke-width="1.5" />
        `;
    } else if (state.garment === 'Jacket') {
        garmentPath = `
            <!-- Anime Outer Jacket -->
            <path d="M58 110 Q100 120 142 110 L168 165 L148 175 L136 148 L136 225 L64 225 L64 148 L52 175 L32 165 Z" fill="${col}" stroke="#1e293b" stroke-width="2.5" />
            <!-- Lapels / Zipper Lining -->
            <path d="M70 110 L100 150 L130 110" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="4" />
            <line x1="100" y1="150" x2="100" y2="225" stroke="#334155" stroke-width="3" />
            <!-- Pocket Flaps -->
            <rect x="70" y="180" width="22" height="12" rx="2" fill="rgba(0,0,0,0.2)" stroke="#1e293b" stroke-width="1" />
            <rect x="108" y="180" width="22" height="12" rx="2" fill="rgba(0,0,0,0.2)" stroke="#1e293b" stroke-width="1" />
        `;
    }

    elements.garmentLayer.innerHTML = garmentPath;
}

/* ==========================================================================
   Weather & Particle Controllers
   ========================================================================== */
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
        state.temperature = 38;
        state.humidity = 55;
        state.wind = 5;
    }

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
