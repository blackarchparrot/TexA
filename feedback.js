document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    body.className = savedTheme;
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.className = 'light-theme';
            localStorage.setItem('theme', 'light-theme');
            updateThemeIcon('light-theme');
        } else {
            body.className = 'dark-theme';
            localStorage.setItem('theme', 'dark-theme');
            updateThemeIcon('dark-theme');
        }
    });

    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'light-theme' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    // 2. Modal Open / Close Logic
    const reviewModal = document.getElementById('reviewModal');
    const btnOpenModal = document.getElementById('btnOpenModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnDone = document.getElementById('btnDone');

    btnOpenModal.addEventListener('click', () => reviewModal.classList.remove('hidden'));
    btnCloseModal.addEventListener('click', () => reviewModal.classList.add('hidden'));
    btnDone.addEventListener('click', () => {
        reviewModal.classList.add('hidden');
        resetForm();
    });

    // 3. Interactive Star Rating System
    const stars = document.querySelectorAll('.star-icon');
    const ratingInput = document.getElementById('ratingInput');
    const ratingText = document.getElementById('ratingText');
    const labels = ['Tap stars to rate', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Very Good 😀', 'Excellent! 🤩'];

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            highlightStars(val, 'hover');
        });

        star.addEventListener('mouseout', resetStars);

        star.addEventListener('click', function() {
            const val = parseInt(this.getAttribute('data-value'));
            ratingInput.value = val;
            ratingText.textContent = labels[val];
            setActiveStars(val);
        });
    });

    function highlightStars(val, className) {
        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) s.classList.add(className);
            else s.classList.remove(className);
        });
    }

    function resetStars() {
        stars.forEach(s => s.classList.remove('hover'));
    }

    function setActiveStars(val) {
        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

    // 4. Form Validation & Submission
    const feedbackForm = document.getElementById('feedbackForm');
    const errorMsg = document.getElementById('errorMsg');
    const thankYouState = document.getElementById('thankYouState');

    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const feedback = document.getElementById('userFeedback').value.trim();
        const rating = parseInt(ratingInput.value);

        if (!name) return showError("Please enter your name.");
        if (rating === 0) return showError("Please select a star rating.");
        if (!email && !phone) return showError("Please provide either an email or a phone number.");
        if (!feedback) return showError("Please write your review feedback.");

        errorMsg.classList.add('hidden');

        // Data payload ready for API integration
        console.log("Submitted Review:", { name, email, phone, rating, feedback });

        // Show thank you view
        feedbackForm.classList.add('hidden');
        thankYouState.classList.remove('hidden');
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function resetForm() {
        feedbackForm.reset();
        ratingInput.value = 0;
        ratingText.textContent = labels[0];
        stars.forEach(s => s.classList.remove('active'));
        feedbackForm.classList.remove('hidden');
        thankYouState.classList.add('hidden');
    }
});
