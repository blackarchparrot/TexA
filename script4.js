document.addEventListener('DOMContentLoaded', () => {
    const dressFileInput = document.getElementById('dressFileInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewWrapper = document.getElementById('previewWrapper');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemove = document.getElementById('btnRemove');
    const btnAnalyze = document.getElementById('btnAnalyze');
    const analysisResults = document.getElementById('analysisResults');

    const resEcoScore = document.getElementById('resEcoScore');
    const resPillingGrade = document.getElementById('resPillingGrade');
    const resColorFastness = document.getElementById('resColorFastness');
    const resWickingRate = document.getElementById('resWickingRate');
    const resSummaryText = document.getElementById('resSummaryText');

    let chartInstance = null;

    // --- Image Preview Handler ---
    dressFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                uploadPlaceholder.classList.add('hidden');
                previewWrapper.classList.remove('hidden');
                btnAnalyze.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Remove Image Handler ---
    btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        dressFileInput.value = '';
        imagePreview.src = '';
        previewWrapper.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        btnAnalyze.disabled = true;
        analysisResults.classList.add('hidden');
    });

    // --- Trigger AI Quality Analysis ---
    btnAnalyze.addEventListener('click', () => {
        const btnText = btnAnalyze.querySelector('.btn-text');
        btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Textile Matrix...';
        btnAnalyze.disabled = true;

        setTimeout(() => {
            btnText.innerHTML = '<i class="fa-solid fa-microscope"></i> Analyze Dress Quality';
            btnAnalyze.disabled = false;

            analysisResults.classList.remove('hidden');
            
            resEcoScore.textContent = "88 / 100";
            resPillingGrade.textContent = "Grade 4.5 / 5";
            resColorFastness.textContent = "Grade 4.8 / 5";
            resWickingRate.textContent = "Fast Dry (12m)";
            
            resSummaryText.textContent = 
                "High-density organic cotton blend with elastane structure detected. " +
                "Exhibits superior resistance to surface friction with minimal color loss risks across 30°C laundry conditions.";

            renderLifecycleChart();
            analysisResults.scrollIntoView({ behavior: 'smooth' });
        }, 1200);
    });

    // --- Chart.js Rendering ---
    function renderLifecycleChart() {
        const ctx = document.getElementById('lifecycleChart').getContext('2d');
        const textColor = '#94a3b8';
        const gridColor = 'rgba(255, 255, 255, 0.08)';

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['New', '5 Washes', '20 Washes', '50 Washes'],
                datasets: [
                    {
                        label: 'Color Retention (%)',
                        data: [100, 98, 92, 85],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Shrinkage Rate (%)',
                        data: [0, 0.5, 1.2, 2.1],
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.15)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: textColor, font: { family: 'Inter' } }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
});
