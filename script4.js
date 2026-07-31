document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const dressFileInput = document.getElementById('dressFileInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewWrapper = document.getElementById('previewWrapper');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemove = document.getElementById('btnRemove');
    const btnAnalyze = document.getElementById('btnAnalyze');
    const analysisResults = document.getElementById('analysisResults');

    // Result Text Elements
    const resEcoScore = document.getElementById('resEcoScore');
    const resPillingGrade = document.getElementById('resPillingGrade');
    const resColorFastness = document.getElementById('resColorFastness');
    const resWickingRate = document.getElementById('resWickingRate');
    const resSummaryText = document.getElementById('resSummaryText');

    let chartInstance = null;

    // --- 1. Theme Toggle Functionality ---
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
        
        // Refresh chart colors if rendered
        if (chartInstance) {
            updateChartTheme();
        }
    });

    // --- 2. Image Handling & Camera Preview ---
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

    btnRemove.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents triggering input re-click
        dressFileInput.value = '';
        imagePreview.src = '';
        previewWrapper.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        btnAnalyze.disabled = true;
        analysisResults.classList.add('hidden');
    });

    // --- 3. AI Analysis Trigger ---
    btnAnalyze.addEventListener('click', () => {
        // UI Feedback: Analyzing state
        const btnText = btnAnalyze.querySelector('.btn-text');
        btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Textile Matrix...';
        btnAnalyze.disabled = true;

        setTimeout(() => {
            // Revert button text
            btnText.innerHTML = '<i class="fa-solid fa-microscope"></i> Analyze Dress Quality';
            btnAnalyze.disabled = false;

            // Display Results
            analysisResults.classList.remove('hidden');
            
            // Populate mock AI analysis data
            resEcoScore.textContent = "88 / 100";
            resPillingGrade.textContent = "Grade 4.5 / 5";
            resColorFastness.textContent = "Grade 4.8 / 5";
            resWickingRate.textContent = "Fast Dry (12 min)";
            
            resSummaryText.textContent = 
                "Textile scan confirms high-density organic cotton blend with elastane threading. " +
                "Exhibits superior resistance to surface friction and low risk of color bleeding under standard 30°C washing cycles.";

            // Render Chart
            renderLifecycleChart();

            // Scroll smoothly down to results
            analysisResults.scrollIntoView({ behavior: 'smooth' });
        }, 1200);
    });

    // --- 4. Chart.js Lifecycle Prediction ---
    function renderLifecycleChart() {
        const ctx = document.getElementById('lifecycleChart').getContext('2d');
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#9CA3AF' : '#64748B';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

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
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Dimensional Shrinkage (%)',
                        data: [0, 0.5, 1.2, 2.1],
                        borderColor: '#EC4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
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
                        labels: { color: textColor }
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

    function updateChartTheme() {
        if (!chartInstance) return;
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#9CA3AF' : '#64748B';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

        chartInstance.options.plugins.legend.labels.color = textColor;
        chartInstance.options.scales.x.ticks.color = textColor;
        chartInstance.options.scales.x.grid.color = gridColor;
        chartInstance.options.scales.y.ticks.color = textColor;
        chartInstance.options.scales.y.grid.color = gridColor;
        chartInstance.update();
    }
});
