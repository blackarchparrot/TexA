// Hardcoded API Key Config
const OPENROUTER_API_KEY = "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";

document.addEventListener('DOMContentLoaded', () => {
    let selectedSkinTone = "Fair / Very Light";

    // Handle Skin Palette Selection
    const paletteCircles = document.querySelectorAll('#skinPalette .color-circle');
    paletteCircles.forEach(circle => {
        circle.addEventListener('click', function() {
            paletteCircles.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedSkinTone = this.getAttribute('data-tone');
        });
    });

    // Handle Generate Event
    const btnGenerate = document.getElementById('btnGenerate');
    btnGenerate.addEventListener('click', getStylistRecommendation);

    async function getStylistRecommendation() {
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes("YOUR_OPENROUTER_API_KEY_HERE")) {
            alert('Please replace OPENROUTER_API_KEY inside script.js with your valid key.');
            return;
        }

        const resultsSection = document.getElementById('resultsSection');
        const resultsList = document.getElementById('resultsList');
        const btnText = btnGenerate.querySelector('.btn-text');

        btnGenerate.disabled = true;
        btnText.innerText = 'Analyzing & Styling...';
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';

        const payloadData = {
            occasion: document.getElementById('occasion').value,
            gender: document.getElementById('gender').value,
            skinTone: selectedSkinTone,
            season: document.getElementById('season').value,
            weather: document.getElementById('weather').value,
            skinConditions: document.getElementById('medicalConditions').value.trim() || "None"
        };

        const systemPrompt = `You are a celebrity fashion stylist and skin-aware textile advisor.
Suggest 3 distinct outfit combinations tailored to the user's inputs.
Return ONLY a valid JSON object strictly matching this schema:
{
  "recommendations": [
    {
      "title": "Outfit Title",
      "matchPercentage": 95,
      "outfitDescription": "Detailed clothing description",
      "colorPalette": [{"name": "Navy Blue", "hex": "#000080"}, {"name": "Beige", "hex": "#F5F5DC"}],
      "recommendedFabrics": ["Organic Cotton", "Linen"],
      "whyItWorks": "Explanation regarding complexion, occasion, and weather",
      "skinCareOrComfortTip": "Specific advice regarding skin issues or weather comfort"
    }
  ]
}`;

        const userPrompt = `User Options:
- Gender: ${payloadData.gender}
- Occasion: ${payloadData.occasion}
- Skin Tone / Complexion: ${payloadData.skinTone}
- Season: ${payloadData.season}
- Weather: ${payloadData.weather}
- Skin Conditions / Medical Issues: ${payloadData.skinConditions}`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Tex AI Stylist',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            const resultData = JSON.parse(data.choices[0].message.content);

            renderResults(resultData.recommendations);
        } catch (error) {
            alert('Error generating recommendations: ' + error.message);
        } finally {
            btnGenerate.disabled = false;
            btnText.innerText = 'Get AI Styling Recommendations';
        }
    }

    function renderResults(recommendations) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsList = document.getElementById('resultsList');

        recommendations.forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card';

            const colorsHtml = item.colorPalette.map(c => `
                <span class="tag">
                    <span class="swatch" style="background-color: ${c.hex || '#ffffff'};"></span>
                    ${c.name || c}
                </span>
            `).join('');

            const fabricsHtml = item.recommendedFabrics.map(f => `
                <span class="tag">${f}</span>
            `).join('');

            card.innerHTML = `
                <div class="result-header-row">
                    <h3>${item.title}</h3>
                    <span class="match-badge">${item.matchPercentage}% Match</span>
                </div>
                <p style="margin-bottom: 0.85rem; color: #e2e8f0; font-size:0.95rem;">${item.outfitDescription}</p>
                
                <div style="margin-bottom: 0.5rem;">
                    <strong style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Colors:</strong> 
                    <div class="tag-list">${colorsHtml}</div>
                </div>
                
                <div style="margin-bottom: 0.5rem;">
                    <strong style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Recommended Fabrics:</strong> 
                    <div class="tag-list">${fabricsHtml}</div>
                </div>

                <p style="font-size:0.9rem; color:#cbd5e1; margin-top:0.75rem; line-height:1.4;">
                    <strong>Why it matches:</strong> ${item.whyItWorks}
                </p>

                ${item.skinCareOrComfortTip ? `
                    <div class="medical-warning">
                        <strong>Care & Skin Tip:</strong> ${item.skinCareOrComfortTip}
                    </div>
                ` : ''}
            `;

            resultsList.appendChild(card);
        });

        resultsSection.classList.remove('hidden');
    }
});
