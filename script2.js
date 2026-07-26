document.addEventListener('DOMContentLoaded', () => {
  // SVG Garment Paths Database
  const garmentPaths = {
    'T-Shirt': '<path d="M60 100 L140 100 L150 135 L135 140 L130 120 L130 185 L70 185 L70 120 L65 140 L50 135 Z" class="garment-path" />',
    'Shirt': '<path d="M60 95 L140 95 L155 135 L140 140 L130 120 L130 190 L70 190 L70 120 L60 140 L45 135 Z" class="garment-path" /><path d="M100 95 L100 190" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>',
    'Hoodie': '<path d="M55 90 L145 90 L160 145 L140 150 L132 125 L132 195 L68 195 L68 125 L60 150 L40 145 Z" class="garment-path" /><path d="M85 90 C85 70, 115 70, 115 90" fill="none" class="garment-path" stroke-width="4"/>',
    'Jacket': '<path d="M50 88 L150 88 L165 150 L142 155 L135 125 L135 200 L65 200 L65 125 L58 155 L35 150 Z" class="garment-path" /><path d="M100 88 L100 200" stroke="#000" stroke-width="3"/>'
  };

  // Preset Properties for Fabrics
  const fabricProperties = {
    'Cotton': { breathability: 80, heatRetention: 45 },
    'Polyester': { breathability: 50, heatRetention: 60 },
    'Wool': { breathability: 30, heatRetention: 90 },
    'Silk': { breathability: 75, heatRetention: 35 },
    'Linen': { breathability: 95, heatRetention: 20 },
    'Denim': { breathability: 35, heatRetention: 70 },
    'Nylon': { breathability: 25, heatRetention: 65 }
  };

  // Weather Preset Profiles
  const weatherPresets = {
    'Sunny': { temp: 28, humidity: 40, wind: 10, bgClass: 'weather-sunny' },
    'Rainy': { temp: 18, humidity: 90, wind: 25, bgClass: 'weather-rainy' },
    'Cloudy': { temp: 20, humidity: 60, wind: 15, bgClass: 'weather-cloudy' },
    'Winter': { temp: 4, humidity: 30, wind: 35, bgClass: 'weather-winter' },
    'Summer': { temp: 38, humidity: 75, wind: 5, bgClass: 'weather-summer' }
  };

  // DOM Elements
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
  const sweatGroup = document.getElementById('sweatGroup');
  const coldGroup = document.getElementById('coldGroup');
  const wetGroup = document.getElementById('wetGroup');
  
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

  // Render Garment Vector
  function updateGarment() {
    const type = selectGarment.value;
    const color = pickerColor.value;
    garmentLayer.innerHTML = garmentPaths[type] || garmentPaths['T-Shirt'];
    
    const paths = garmentLayer.querySelectorAll('.garment-path');
    paths.forEach(p => {
      if (!p.getAttribute('stroke-width')) {
        p.setAttribute('fill', color);
      } else {
        p.setAttribute('stroke', color);
      }
    });

    stageGarmentLabel.textContent = `${activeFabric} ${type}`;
  }

  // Update Dynamic Indicators and Metrics
  function runSimulation() {
    const temp = parseInt(sliderTemp.value);
    const humidity = parseInt(sliderHumidity.value);
    const wind = parseInt(sliderWind.value);

    valTemp.textContent = `${temp}°C`;
    valHumidity.textContent = `${humidity}%`;
    valWind.textContent = `${wind} km/h`;

    const fabric = fabricProperties[activeFabric];

    // Calculate Metrics
    let heatBalance = (temp - 22) * 3 - (wind * 0.5) + (fabric.heatRetention * 0.3) - (fabric.breathability * 0.2);
    let comfortScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(heatBalance) * 2.5)));
    let riskScore = Math.max(0, Math.min(100, Math.round(Math.abs(heatBalance) * 1.8)));

    // UI Updates
    valComfortScore.textContent = comfortScore;
    const offset = 314 - (314 * comfortScore) / 100;
    gaugeComfort.style.strokeDashoffset = offset;

    valBreathability.textContent = `${fabric.breathability}%`;
    barBreathability.style.width = `${fabric.breathability}%`;
    
    valHeatRetention.textContent = `${fabric.heatRetention}%`;
    barHeatRetention.style.width = `${fabric.heatRetention}%`;

    valRiskScore.textContent = `${riskScore}%`;

    // Overlays & Mood Adjustments
    sweatGroup.classList.add('hidden');
    coldGroup.classList.add('hidden');
    wetGroup.classList.add('hidden');

    if (activeWeather === 'Rainy') {
      wetGroup.classList.remove('hidden');
    }

    if (heatBalance > 15) {
      sweatGroup.classList.remove('hidden');
      avatarFace.textContent = '🥵';
      currentMood.textContent = 'Overheating';
      currentThermalState.textContent = 'Excess Heat Accumulation';
    } else if (heatBalance < -15) {
      coldGroup.classList.remove('hidden');
      avatarFace.textContent = '🥶';
      currentMood.textContent = 'Freezing';
      currentThermalState.textContent = 'Thermoregulation Struggling';
    } else {
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

    // Recommendations Logic
    if (comfortScore > 75) {
      recTitle.textContent = 'Optimal Gear Setup';
      recReason.textContent = `The selected ${activeFabric} ${selectGarment.value} provides an excellent balance of breathability and insulation for ${temp}°C conditions.`;
    } else if (heatBalance > 15) {
      recTitle.textContent = 'Cooling Suggested';
      recReason.textContent = `High risk of overheating. Consider switching to lighter fabrics like Linen or Cotton and lowering garment coverage.`;
    } else {
      recTitle.textContent = 'Insulation Recommended';
      recReason.textContent = `Cold environment detected. Switch to higher heat-retention fabrics like Wool or add outer layers like a Jacket.`;
    }
  }

  // Event Listeners for Controls
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

  // Export Report Button Action
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

  // Initial Initialization
  updateGarment();
  runSimulation();
});
