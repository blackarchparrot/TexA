/**
 * TexelSense AI - Ultra-Fast Matrix Interpolation Comfort Engine
 * Optimized for High-Performance Real-Time UI Responsiveness
 */

  
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

  
  
function getTargetClo(temp) {
    if (temp <= 0)  return 3.5;
    if (temp <= 10) return 2.5;
    if (temp <= 18) return 1.5;
    if (temp <= 22) return 0.8;
    if (temp <= 26) return 0.4;
    if (temp <= 30) return 0.2;
    return 0.1; // > 30°C extreme heat
}

  
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

  
    const currentClo = fab.clo * garm.cloMult;

  
    const windEffect = (state.wind / 10) * 1.2;
    const humidityEffect = (state.humidity > 50) ? ((state.humidity - 50) * 0.12) : 0;
    const apparentTemp = state.temperature - windEffect + humidityEffect;

  
    const targetClo = getTargetClo(apparentTemp);

  
    const cloDelta = currentClo - targetClo;

  
    let comfort = 100;

    if (cloDelta > 0) {
  
        const heatPenalty = cloDelta * 42; // Heavy penalty multiplier
        const humidityStifling = 1 + ((state.humidity / 100) * (fab.ret / 20));
        comfort -= heatPenalty * humidityStifling;
    } else {
  
        const coldPenalty = Math.abs(cloDelta) * 35;
        const windPenalty = 1 + (state.wind / 30);
        comfort -= coldPenalty * windPenalty;
    }

  
    if (state.weather === 'Rainy' && fab.hydrophobic < 50) {
        comfort -= (50 - fab.hydrophobic) * 1.2;
    }

    comfort = Math.max(0, Math.min(100, Math.round(comfort)));

  
    let risk = 2;
    if (cloDelta > 1.2) risk += (cloDelta - 1.2) * 45;      // Heat exhaustion
    if (cloDelta < -1.5) risk += (Math.abs(cloDelta) - 1.5) * 40; // Hypothermia
    if (state.weather === 'Rainy' && fab.hydrophobic < 25) risk += 35;
    risk = Math.max(2, Math.min(99, Math.round(risk)));

  
    const heatRetention = Math.min(100, Math.round((currentClo / 3.0) * 100));
    const breathability = Math.max(5, Math.min(100, Math.round(fab.breathability / (garm.coverage * 1.1))));

  
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
 * Biometric Expression Mapper
 */
function applyBiometricState(res) {
    elements.sweatGroup.classList.add('hidden');
    elements.coldGroup.classList.add('hidden');
    elements.wetGroup.classList.add('hidden');
    elements.characterWrapper.classList.remove('shivering');
    elements.headBase.setAttribute('fill', '#f3d2b3');

  
    if (res.cloDelta > 0.6 || (state.temperature >= 24 && ['Hoodie', 'Jacket'].includes(state.garment))) {
        setAvatar('🥵', 'Overheating', 'Excess Thermal Trapping');
        elements.sweatGroup.classList.remove('hidden');
        elements.headBase.setAttribute('fill', '#fca5a5'); // Flushed skin
    } 
  
    else if (res.cloDelta < -0.6 || (state.temperature <= 12 && res.comfort < 50)) {
        setAvatar('🥶', 'Freezing', 'Severe Thermal Deficit');
        elements.coldGroup.classList.remove('hidden');
        elements.characterWrapper.classList.add('shivering');
        elements.headBase.setAttribute('fill', '#dbeafe'); // Cold skin
    } 
  
    else if (state.weather === 'Rainy' && res.waterResistance < 45) {
        setAvatar('🌧️', 'Soaked', 'High Water Penetration');
        elements.wetGroup.classList.remove('hidden');
    } 
  
    else if (res.comfort >= 80) {
        setAvatar('😎', 'Relaxed', 'Thermoregulation Neutral');
    } 
  
    else if (res.comfort >= 55) {
        setAvatar('😀', 'Comfortable', 'Microclimate Stable');
    } 
  
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
   Stage Renderers
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
