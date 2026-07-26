document.addEventListener('DOMContentLoaded', () => {
  // SVG Garment Precision Paths for Realistic Male Frame
  const garmentPaths = {
    'T-Shirt': `
      <path d="M132 112 Q150 120 168 112 L192 122 L182 165 L168 158 L168 250 L132 250 L132 158 L118 165 L108 122 Z" class="garment-main" />
      <path d="M132 112 Q150 122 168 112" stroke="rgba(0,0,0,0.2)" stroke-width="3" fill="none" />
    `,
    'Shirt': `
      <path d="M130 110 Q150 118 170 110 L195 120 L185 248 L115 248 L105 120 Z" class="garment-main" />
      <!-- Collar & Buttons -->
      <path d="M130 110 L150 135 L170 110" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2" />
      <path d="M150 135 L150 248" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
      <circle cx="150" cy="155" r="2" fill="#fff" />
      <circle cx="150" cy="180" r="2" fill="#fff" />
      <circle cx="150" cy="205" r="2" fill="#fff" />
    `,
    'Hoodie': `
      <path d="M126 108 L174 108 L202 122 L188 220 L172 215 L170 252 L130 252 L128 215 L112 220 L98 122 Z" class="garment-main" />
      <!-- Hood Collar & Front Pocket -->
      <path d="M128 108 C128 85 172 85 172 108" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="5" />
      <path d="M135 210 L165 210 L168 240 L132 240 Z" fill="rgba(0,0,0,0.1)" stroke="rgba(0,0,0,0.2)" stroke-width="1.5" />
    `,
    'Jacket': `
      <path d="M124 105 L176 105 L204 122 L190 228 L174 222 L172 254 L128 254 L126 222 L110 228 L96 122 Z" class="garment-main" />
      <!-- Inner Zipper & Lapels -->
      <path d="M124 105 L145 150 L150 254" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
      <path d="M176 105 L155 150 L150 254" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
    `
  };

  const fabricProperties = {
    'Cotton': { breathability: 80, heatRetention: 45 },
    'Polyester': { breathability: 50, heatRetention: 60 },
    'Wool': { breathability: 30, heatRetention: 90 },
    'Silk': { breathability: 75, heatRetention: 35 },
    'Linen': { breathability: 95, heatRetention: 20 },
    'Denim': { breathability: 35, heatRetention: 70 }
  };

  const weatherPresets = {
    'Sunny': { temp: 28, humidity: 40, wind: 10, bgClass: 'weather-sunny' },
    'Rainy': { temp: 18, humidity: 90, wind: 25, bgClass: 'weather-rainy' },
    'Cloudy': { temp: 20, humidity: 60, wind: 15, bgClass: 'weather-cloudy' },
    'Winter': { temp: 4, humidity: 30, wind: 35, bgClass: 'weather-winter' },
    'Summer': { temp: 38, humidity: 75, wind: 5, bgClass: 'weather-summer' }
  };

  // DOM Handles
  const selectGarment = document.getElementById('selectGarment');
  const pickerColor = document.getElementById('pickerColor');
  const garmentLayer = document.getElementById('garmentLayer');
  const stageGarmentLabel = document.getElementById('stageGarmentLabel');
  
  const sliderTemp = document.getElementById('sliderTemp');
  const sliderHumidity = document.getElementById('sliderHumidity');
  const sliderWind = document.getElementById('sliderWind');
  
  const valTemp = document.getElementById('valTemp');
  const valHumidity = document.getElementById('valHumidity');
  const valWind = document.getElementById('valWind');
  
  const stageBg = document.getElementById('stageBg');
  const overlayHeat = document.getElementById('overlayHeat');
  const overlayCold = document.getElementById('overlayCold');
  const sweatGroup = document.getElementById('sweatGroup');
  const coldGroup = document.getElementById('coldGroup');
  const wetGroup = document.getElementById('wetGroup');
  const mouthLine = document.getElementById('mouthLine');

  const avatarFace = document.getElementById('avatarFace');
  const currentMood = document.getElementById('currentMood');
  const currentThermalState = document.getElementById('currentThermalState');
  
  const valComfortScore = document.getElementById('valComfortScore');
  const gaugeComfort = document.getElementById('gaugeComfort');
  const valBreathability = document.getElementById('valBreathability');
  const barBreathability = document.getElementById('barBreathability');
  const valHeatRetention = document.getElementById('valHeatRetention');
  const barHeatRetention = document.getElementById('barHeatRetention');

  const valRiskScore = document.getElementById('valRiskScore');
  const badgeRisk = document.getElementById('badgeRisk');
  const recTitle = document.getElementById('recTitle');
  const recReason = document.getElementById('recReason');

  let activeFabric = 'Cotton';
  let activeWeather = 'Sunny';

  function updateGarment() {
    const type = selectGarment.value;
    const color = pickerColor.value;
    
    garmentLayer.innerHTML = garmentPaths[type] || garmentPaths['T-Shirt'];
    const mainGarment = garmentLayer.querySelector('.garment-main');
    if (mainGarment) {
      mainGarment.setAttribute('fill', color);
    }
    stageGarmentLabel.textContent = `${activeFabric} ${type}`;
  }

  function runSimulation() {
    const temp = parseInt(sliderTemp.value);
    const humidity = parseInt(sliderHumidity.value);
    const wind = parseInt(sliderWind.value);

    valTemp.textContent = `${temp}°C`;
    valHumidity.textContent = `${humidity}%`;
    valWind.textContent = `${wind} km/h`;

    const fabric = fabricProperties[activeFabric];

    // Thermodynamic calculation
    let heatBalance = (temp - 22) * 3 - (wind * 0.5) + (fabric.heatRetention * 0.3) - (fabric.breathability * 0.2);
    let comfortScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(heatBalance) * 2.5)));
    let riskScore = Math.max(0, Math.min(100, Math.round(Math.abs(heatBalance) * 1.8)));

    // Update Comfort Gauge Meter
    valComfortScore.textContent = comfortScore;
    const offset = 314 - (314 * comfortScore) / 100;
    gaugeComfort.style.strokeDashoffset = offset;

    valBreathability.textContent = `${fabric.breathability}%`;
    barBreathability.style.width = `${fabric.breathability}%`;
    
    valHeatRetention.textContent = `${fabric.heatRetention}%`;
    barHeatRetention.style.width = `${fabric.heatRetention}%`;

    valRiskScore.textContent = `${riskScore}%`;

    // Reset facial overlays
    overlayHeat.classList.add('hidden');
    overlayCold.classList.add('hidden');
    sweatGroup.classList.add('hidden');
    coldGroup.classList.add('hidden');
    wetGroup.classList.add('hidden');

    if (activeWeather === 'Rainy') {
      wetGroup.classList.remove('hidden');
    }

    // Thermal Discomfort logic -> Apply Facial Overlays
    if (heatBalance > 15) {
      overlayHeat.classList.remove('hidden');
      sweatGroup.classList.remove('hidden');
      mouthLine.setAttribute('d', 'M142 83 Q150 75 158 83'); // Frown/Sweating mouth
      avatarFace.textContent = '🥵';
      currentMood.textContent = 'Overheating';
      currentThermalState.textContent = 'Excess Heat Accumulation';
    } else if (heatBalance < -15) {
      overlayCold.classList.remove('hidden');
      coldGroup.classList.remove('hidden');
      mouthLine.setAttribute('d', 'M142 82 Q150 80 158 82'); // Cold mouth
      avatarFace.textContent = '🥶';
      currentMood.textContent = 'Freezing';
      currentThermalState.textContent = 'Thermoregulation Struggling';
    } else {
      mouthLine.setAttribute('d', 'M142 78 Q150 83 158 78'); // Smile mouth
      avatarFace.textContent = '😀';
      currentMood.textContent = 'Comfortable';
      currentThermalState.textContent = 'Thermoregulation Optimal';
    }

    // Risk Badges
    if (riskScore < 25) {
      badgeRisk.textContent = 'Low';
      badgeRisk.className = 'score-badge badge-green';
    } else if (riskScore < 60) {
      badgeRisk.textContent = 'Moderate';
      badgeRisk.className = 'score-badge badge-blue';
    } else {
      badgeRisk.textContent = 'High';
      badgeRisk.className = 'score-badge badge-red';
    }

    // Recommendations
    if (comfortScore > 75) {
      recTitle.textContent = 'Optimal Gear Setup';
      recReason.textContent = `The selected ${activeFabric} ${selectGarment.value} provides an excellent balance of breathability and insulation for ${temp}°C conditions.`;
    } else if (heatBalance > 15) {
      recTitle.textContent = 'Cooling Suggested';
      recReason.textContent = `High risk of overheating. Switch to lighter fabrics like Linen or Cotton.`;
    } else {
      recTitle.textContent = 'Insulation Recommended';
      recReason.textContent = `Cold environment detected. Switch to higher heat-retention fabrics like Wool or add outer layers.`;
    }
  }

  // Event Listeners
  document.querySelectorAll('#fabricChips .chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#fabricChips .chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      activeFabric = e.target.dataset.value;
      updateGarment();
      runSimulation();
    });
  });

  document.querySelectorAll('#weatherChips .chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#weatherChips .chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      
      activeWeather = e.target.dataset.value;
      const preset = weatherPresets[activeWeather];
      
      sliderTemp.value = preset.temp;
      sliderHumidity.value = preset.humidity;
      sliderWind.value = preset.wind;

      stageBg.className = `stage-background ${preset.bgClass}`;
      runSimulation();
    });
  });

  selectGarment.addEventListener('change', updateGarment);
  pickerColor.addEventListener('input', updateGarment);

  [sliderTemp, sliderHumidity, sliderWind].forEach(slider => {
    slider.addEventListener('input', runSimulation);
  });

  document.getElementById('btnSimulate').addEventListener('click', runSimulation);

  document.getElementById('btnReset').addEventListener('click', () => {
    sliderTemp.value = 25;
    sliderHumidity.value = 50;
    sliderWind.value = 15;
    selectGarment.value = 'T-Shirt';
    pickerColor.value = '#3b82f6';
    activeFabric = 'Cotton';
    
    document.querySelectorAll('#fabricChips .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.value === 'Cotton');
    });

    updateGarment();
    runSimulation();
  });

  document.getElementById('btnRandomWeather').addEventListener('click', () => {
    const keys = Object.keys(weatherPresets);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const targetChip = document.querySelector(`#weatherChips .chip[data-value="${randomKey}"]`);
    if (targetChip) targetChip.click();
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    const reportData = `TexelSense AI - Comfort Report
---------------------------------
Fabric: ${activeFabric}
Garment: ${selectGarment.value}
Temperature: ${sliderTemp.value}°C
Humidity: ${sliderHumidity.value}%
Wind Speed: ${sliderWind.value} km/h
Comfort Score: ${valComfortScore.textContent}%
Thermal Risk: ${valRiskScore.textContent}
Status: ${currentMood.textContent}
    `;
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TexelSense_Comfort_Report.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Initial Execution
  updateGarment();
  runSimulation();
});
