/* ==========================================================================
   TexelSense AI - Precision Physics Engine (ISO 7730 / ASHRAE Standard 55)
   ========================================================================== */

const FABRIC_PROPERTIES = {
    Cotton:    { icl: 0.90, ret: 0.015, im: 0.45, waterAbsorption: 8.5,  waterResistance: 10 },
    Polyester: { icl: 0.75, ret: 0.045, im: 0.32, waterAbsorption: 0.4,  waterResistance: 75 },
    Wool:      { icl: 1.35, ret: 0.035, im: 0.40, waterAbsorption: 17.0, waterResistance: 40 },
    Silk:      { icl: 0.65, ret: 0.020, im: 0.38, waterAbsorption: 11.0, waterResistance: 15 },
    Linen:     { icl: 0.55, ret: 0.012, im: 0.48, waterAbsorption: 12.0, waterResistance: 5  },
    Denim:     { icl: 1.10, ret: 0.050, im: 0.30, waterAbsorption: 7.5,  waterResistance: 30 },
    Nylon:     { icl: 0.70, ret: 0.065, im: 0.25, waterAbsorption: 4.5,  waterResistance: 90 }
};

const GARMENT_FACTORS = {
    'T-Shirt': { cloScale: 0.40, retScale: 0.60, coverage: 0.40 },
    'Shirt':   { cloScale: 0.55, retScale: 0.75, coverage: 0.50 },
    'Hoodie':  { cloScale: 1.10, retScale: 1.30, coverage: 0.85 },
    'Jacket':  { cloScale: 1.50, retScale: 1.60, coverage: 0.95 }
};

function runSimulation() {
    const fab = FABRIC_PROPERTIES[state.fabric];
    const garm = GARMENT_FACTORS[state.garment];

    // 1. Insulation & Area Factor
    const Icl = fab.icl * garm.cloScale;                  // clo
    const IclSI = Icl * 0.155;                            // m²K/W
    const Ret = fab.ret * garm.retScale;                  // Total Evaporative Resistance (m²Pa/W)
    const fcl = Icl <= 0.5 ? 1.0 + 0.2 * Icl : 1.05 + 0.1 * Icl; // Garment area factor

    // 2. Environmental Variables
    const Ta = state.temperature;                         // Air Temp (°C)
    const RH = state.humidity;                            // Relative Humidity (%)
    const varMs = Math.max(0.1, state.wind / 3.6);        // Air velocity (m/s)

    // Mean Radiant Temperature (Tr) Solar/Cloud Adjustment
    let Tr = Ta;
    if (state.weather === 'Sunny' || state.weather === 'Summer') Tr = Ta + 6.5;
    else if (state.weather === 'Cloudy') Tr = Ta + 0.5;
    else if (state.weather === 'Rainy') Tr = Ta - 1.5;
    else if (state.weather === 'Winter') Tr = Ta - 3.0;

    // Ambient Water Vapor Pressure (Pa) via Buck Equation
    const pa = (RH / 100) * 611.21 * Math.exp((17.502 * Ta) / (240.97 + Ta));

    // Metabolic Parameters (Resting/Light Activity)
    const M = 58.2;                                       // W/m² (1.0 met)
    const W = 0;                                          // External work
    const Tsk = 35.7 - 0.028 * (M - W);                   // Skin Temp (°C)
    const psk = 611.21 * Math.exp((17.502 * Tsk) / (240.97 + Tsk)); // Saturated vapor pressure at skin (Pa)

    // 3. Robust Iterative Solver for Clothing Surface Temperature (Tcl)
    let Tcl = (Tsk + Ta) / 2;                             // Initial estimate
    let hc = 0;
    let iteration = 0;
    let maxDelta = 1.0;

    while (maxDelta > 0.001 && iteration < 100) {
        const hcForced = 12.1 * Math.sqrt(varMs);
        const hcNatural = 2.38 * Math.pow(Math.abs(Tcl - Ta), 0.25);
        hc = Math.max(hcForced, hcNatural);

        const radTerm = 3.96e-8 * fcl * (Math.pow(Tcl + 273.15, 4) - Math.pow(Tr + 273.15, 4));
        const convTerm = fcl * hc * (Tcl - Ta);
        
        const TclNew = Tsk - IclSI * (radTerm + convTerm);
        maxDelta = Math.abs(TclNew - Tcl);
        Tcl = 0.7 * Tcl + 0.3 * TclNew;                   // Dampened convergence
        iteration++;
    }

    // 4. Biophysical Heat Exchange Balance (6 Terms)
    // Vapor diffusion heat loss incorporating fabric Ret resistance
    const R_total_vapor = Ret + (1 / (16.7 * hc * fcl));  // Air layer + Fabric vapor resistance
    const Hl1 = (psk - pa) / R_total_vapor;               // Skin vapor diffusion (W/m²)
    
    // Sweating heat loss
    const Hl2 = (M - W) > 58.15 ? 0.42 * ((M - W) - 58.15) : 0; 
    
    // Respiration latent & dry heat loss
    const Hl3 = 1.7e-5 * M * (5867 - pa);                 
    const Hl4 = 0.0014 * M * (34 - Ta);                   

    // Radiative & Convective heat loss from outer garment
    const Hl5 = 3.96e-8 * fcl * (Math.pow(Tcl + 273.15, 4) - Math.pow(Tr + 273.15, 4)); 
    const Hl6 = fcl * hc * (Tcl - Ta);                     

    // Thermal Load (L)
    const L = (M - W) - Hl1 - Hl2 - Hl3 - Hl4 - Hl5 - Hl6;

    // 5. Predicted Mean Vote (PMV) & PPD Calculation
    let PMV = (0.303 * Math.exp(-0.036 * M) + 0.028) * L;

    // Rainy dynamics: Reduced insulation from moisture absorption
    if (state.weather === 'Rainy') {
        const saturationPenalty = (100 - fab.waterResistance) / 100;
        PMV -= saturationPenalty * 0.85;                  // Shift balance toward cold thermal sensation
    }
    PMV = Math.max(-3.0, Math.min(3.0, PMV));

    // ISO 7730 PPD Formula
    const PPD = 100 - 95 * Math.exp(-(0.03353 * Math.pow(PMV, 4) + 0.2179 * Math.pow(PMV, 2)));

    // 6. UI Metric Conversions
    const comfort = Math.max(0, Math.min(100, Math.round(100 - PPD)));
    const thermalDelta = Number((Tsk - Tcl).toFixed(2));  // Real physical delta across garment layer (°C)
    
    // Effective Breathability: Normalized inverse ratio of vapor resistance
    const effectiveBreathability = Math.max(5, Math.min(100, Math.round((1 - (Ret / 0.10)) * 100)));
    
    // Effective Heat Retention
    const totalHeatRetention = Math.max(0, Math.min(100, Math.round((Icl / 2.5) * 100)));

    // Risk Mapping based on ISO 7730 PMV bounds
    let risk = Math.round(PPD);
    if (state.weather === 'Rainy' && fab.waterResistance < 20) risk = Math.min(98, risk + 30);

    let fashion = 88;
    if (state.weather === 'Summer' && ['Wool', 'Hoodie', 'Jacket'].includes(state.garment)) fashion -= 45;
    if (state.weather === 'Winter' && ['Linen', 'Silk', 'T-Shirt'].includes(state.garment)) fashion -= 40;
    fashion = Math.max(10, Math.min(99, Math.round(fashion)));

    // UI Dispatch
    updateMetricsUI({
        comfort,
        risk,
        fashion,
        breathability: effectiveBreathability,
        heatRetention: totalHeatRetention,
        thermalDelta,
        waterResistance: fab.waterResistance,
        pmv: PMV,
        ppd: PPD
    });
}
