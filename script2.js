/**
 * TexelSense AI - ISO 7730 / ASHRAE Standard 55 Thermal Comfort Engine
 * Refined Biophysical Thermodynamics & Multi-State Expression Engine
 */

// Fabric Physical Constants
// clo: Thermal Insulation | ret: Evaporative Resistance (m²Pa/W) | hydrophobic: Water Resistance (%)
const FABRIC_PROPERTIES = {
    Cotton:    { clo: 0.38, ret: 11.5, hydrophobic: 12, baseBreathability: 88 },
    Polyester: { clo: 0.42, ret: 28.0, hydrophobic: 82, baseBreathability: 32 },
    Wool:      { clo: 1.25, ret: 48.0, hydrophobic: 45, baseBreathability: 42 },
    Silk:      { clo: 0.28, ret: 9.5,  hydrophobic: 18, baseBreathability: 78 },
    Linen:     { clo: 0.22, ret: 7.2,  hydrophobic: 8,  baseBreathability: 96 },
    Denim:     { clo: 0.85, ret: 38.0, hydrophobic: 28, baseBreathability: 38 },
    Nylon:     { clo: 0.32, ret: 52.0, hydrophobic: 94, baseBreathability: 18 }
};

const GARMENT_MULTIPLIERS = {
    'T-Shirt': { coverage: 0.40, cloMult: 1.0 },
    'Shirt':   { coverage: 0.55, cloMult: 1.35 },
    'Hoodie':  { coverage: 0.85, cloMult: 2.45 },
    'Jacket':  { coverage: 0.95, cloMult: 3.20 }
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
   Full Biophysical Thermodynamic Heat Balance Engine
   ========================================================================== */
function runSimulation() {
    const fab = FABRIC_PROPERTIES[state.fabric];
    const garm = GARMENT_MULTIPLIERS[state.garment];

    // 1. Total Clothing Thermal Resistance
    const totalClo = fab.clo * garm.cloMult;
    const rClo = 0.155 * totalClo; // m²K/W
    const effectiveRet = fab.ret * garm.coverage;

    // 2. Convective Heat Transfer Coefficient (h_c) driven by Wind Speed (m/s)
    const windSpeedMS = Math.max(0.1, state.wind / 3.6);
    const h_c = 12.1 * Math.sqrt(windSpeedMS); // Convective coefficient

    // 3. Vapor Pressure & Humidity Calculations (Tetens Equation)
    const T_amb = state.temperature;
    const p_sat_amb = 610.78 * Math.exp((17.27 * T_amb) / (T_amb + 237.3)); // Pa
    const p_amb = (state.humidity / 100) * p_sat_amb; // Ambient vapor pressure

    const T_skin_neutral = 33.5; // °C
    const p_sat_skin = 610.78 * Math.exp((17.27 * T_skin_neutral) / (T_skin_neutral + 237.3)); // ~5100 Pa

    // 4. Maximum Evaporative Sweat Heat Dissipation Potential (E_max)
    const R_e_air = 1 / (16.5 * h_c); // Boundary air evaporative resistance
    const R_e_total = (effectiveRet / 1000) + R_e_air; // Total vapor resistance
    const E_max = Math.max(5, (p_sat_skin - p_amb) / R_e_total); // W/m²

    // 5. Total Heat Dissipation Capacity (Q_dissipated)
    const M_metabolic = 65; // W/m² (Resting/Light Activity)
    const Q_rad_conv = (T_skin_neutral - T_amb) / (rClo + (1 / h_c)); // Sensible Heat Transfer
    
    // Total Thermal Load Imbalance Delta (W/m²)
    // If positive: body is trapping heat. If negative: body is losing heat faster than generated.
    let heatImbalance = M_metabolic - Q_rad_conv;

    if (heatImbalance > 0) {
        // Body needs to sweat. Heat load is reduced by E_max, but limited by fabric breathability/Ret
        heatImbalance = Math.max(0, heatImbalance - (E_max * 0.45));
    }

    // 6. Non-Linear Rigid Comfort Penalization
    let comfort = 100;

    if (heatImbalance > 0) {
        // OVERHEATING TRAJECTORY: Heavy garments in warm/summer weather cause exponential failure
        const heatPenalty = Math.pow(heatImbalance / 2.8, 1.95);
        const humidityStiflingFactor = 1 + ((state.humidity / 100) * (effectiveRet / 15));
        comfort -= heatPenalty * humidityStiflingFactor;
    } else {
        // FREEZING TRAJECTORY: Thin garments in cold weather
        const coldDeficit = Math.abs(heatImbalance);
        const windChillFactor = 1 + (h_c / 15);
        const coldPenalty = Math.pow(coldDeficit / 3.2, 1.85) * windChillFactor;
        comfort -= coldPenalty;
    }

    // Direct Rain Saturation Penalty
    if (state.weather === 'Rainy' && fab.hydrophobic < 50) {
        comfort -= (50 - fab.hydrophobic) * 1.35;
    }

    comfort = Math.max(0, Math.min(100, Math.round(comfort)));

    // 7. Health & Thermal Stress Risk Metric
    let risk = 2;
    if (heatImbalance > 45) risk += (heatImbalance - 45) * 1.8;  // Extreme Heat Exhaustion Risk
    if (heatImbalance < -55) risk += (Math.abs(heatImbalance) - 55) * 1.6; // Hypothermia Risk
    if (state.weather === 'Rainy' && fab.hydrophobic < 25) risk += 30;
    risk = Math.max(2, Math.min(99, Math.round(risk)));

    // 8. Display Bar Metrics
    const displayHeatRetention = Math.min(100, Math.round((totalClo / 3.2) * 100));
    const displayBreathability = Math.max(5, Math.min(100, Math.round(fab.baseBreathability / (garm.coverage * 1.15))));

    // Contextual Fashion Score
    let fashion = 92;
    if (state.temperature >= 24 && ['Hoodie', 'Jacket'].includes(state.garment)) fashion -= 60;
    if (state.temperature <= 12 && ['Linen', 'Silk', 'T-Shirt'].includes(state.garment)) fashion -= 50;
    fashion = Math.max(5, Math.min(99, Math.round(fashion)));

    // UI Updates
    updateMetricsUI({
        comfort,
        risk,
        fashion,
        breathability: displayBreathability,
        heatRetention: displayHeatRetention,
        heatImbalance,
        waterResistance: fab.hydrophobic
    });
}

function updateMetricsUI(results) {
    const offset = 314 - (314 * results.comfort) / 100;
    elements.gaugeComfort.style.strokeDashoffset = offset;
    elements.valComfortScore.textContent = results.comfort;

    elements.valBreathability.textContent = `${results.breathability}%`;
    elements.barBreathability.style.width = `${results.breathability}%`;

    elements.valHeatRetention.textContent = `${results.heatRetention}%`;
    elements.barHeatRetention.style.width = `${results.heatRetention}%`;

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

    applyBiometricState(results);
    generateRecommendation(results);
}

/**
 * Biometric Expression State Matrix Mapper
 */
function applyBiometricState(res) {
    elements.sweatGroup.classList.add('hidden');
    elements.coldGroup.classList.add('hidden');
    elements.wetGroup.classList.add('hidden');
    elements.characterWrapper.classList.remove('shivering');
    elements.headBase.setAttribute('fill', '#f3d2b3');

    // 1. Overheating / Excessive Heat Trapping State
    // Triggers if heat imbalance > 18 W/m² OR temperature >= 25°C with heavy garments (comfort < 55%)
    if (res.heatImbalance > 18 || (state.temperature >= 24 && res.comfort < 55)) {
        setAvatar('🥵', 'Overheating', 'Severe Heat Accumulation');
        elements.sweatGroup.classList.remove('hidden');
        elements.headBase.setAttribute('fill', '#fca5a5'); // Thermal skin flushing
    } 
    // 2. Freezing / Excessive Heat Loss State
    else if (res.heatImbalance < -22 || (state.temperature <= 12 && res.comfort < 55)) {
        setAvatar('🥶', 'Freezing', 'Rapid Heat Dissipation');
        elements.coldGroup.classList.remove('hidden');
        elements.characterWrapper.classList.add('shivering');
        elements.headBase.setAttribute('fill', '#dbeafe'); // Hypothermic pale blue
    } 
    // 3. Wet / Rain Impact
    else if (state.weather === 'Rainy' && res.waterResistance < 45) {
        setAvatar('🌧️', 'Soaked', 'High Water Ingress');
        elements.wetGroup.classList.remove('hidden');
    } 
    // 4. Relaxed State
    else if (res.comfort >= 82) {
        setAvatar('😎', 'Relaxed', 'Thermoregulation Optimal');
    } 
    // 5. Comfortable State
    else if (res.comfort >= 55) {
        setAvatar('😀', 'Comfortable', 'Microclimate Stable');
    } 
    // 6. Mild Discomfort / Uneasy State
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
    let reason = `${state.fabric} ${state.garment} provides a balanced microclimate for ${state.temperature}°C conditions.`;

    if (results.heatImbalance > 18) {
        icon = '🔥';
        title = 'Overheating Risk';
        reason = `${state.garment} traps too much heat in ${state.temperature}°C weather. Switch to breathable lightweight T-Shirts in Linen or Cotton.`;
    } else if (results.heatImbalance < -22) {
        icon = '❄️';
        title = 'Insulation Deficit';
        reason = `${state.fabric} ${state.garment} lacks necessary thermal insulation for ${state.temperature}°C conditions. Upgrade to Wool, Hoodies, or Jackets.`;
    } else if (state.weather === 'Rainy' && results.waterResistance < 45) {
        icon = '🌧️';
        title = 'Water Penetration Warning';
        reason = `${state.fabric} absorbs rainwater quickly. Switch to hydrophobic fabrics like Nylon or Polyester outer shells.`;
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
