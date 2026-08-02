document.addEventListener('DOMContentLoaded', () => {
    // Theme Switcher Logic
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    // Load saved theme or default to dark
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
        if (theme === 'light-theme') {
            themeIcon.className = 'fa-solid fa-moon';
        } else {
            themeIcon.className = 'fa-solid fa-sun';
        }
    }

    // Interactive Star Rating Logic
    const stars = document.querySelectorAll('.star-icon');
    const ratingInput = document.getElementById('ratingInput');
    const ratingText = document.getElementById('ratingText');
    const labels = ['Tap to rate', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Very Good 😀', 'Excellent! 🤩'];

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            highlightStars(val, 'hover');
        });

        star.addEventListener('mouseout', function() {
            resetStars();
        });

        star.addEventListener('click', function() {
            const val = parseInt(this.getAttribute('data-value'));
            ratingInput.value = val;
            ratingText.textContent = labels[val];
            setActiveStars(val);
        });
    });

    function highlightStars(val, className) {
        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) {
                s.classList.add(className);
            } else {
                s.classList.remove(className);
            }
        });
    }

    function resetStars() {
        stars.forEach(s => s.classList.remove('hover'));
    }

    function setActiveStars(val) {
        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    }

    // Form Validation & Submission
    const feedbackForm = document.getElementById('feedbackForm');
    const errorBanner = document.getElementById('feedbackError');
    const errorMessage = document.getElementById('feedbackErrorMessage');
    const thankyouState = document.getElementById('thankyouState');

    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const feedback = document.getElementById('userFeedback').value.trim();
        const rating = parseInt(ratingInput.value);

        // Validation Checks
        if (!name) {
            showError("Please enter your name.");
            return;
        }

        if (rating === 0) {
            showError("Please select a star rating.");
            return;
        }

        if (!email && !phone) {
            showError("Please provide at least an email address or a phone number.");
            return;
        }

        if (!feedback) {
            showError("Please leave your feedback message.");
            return;
        }

        // Hide error banner if everything is valid
        errorBanner.classList.add('hidden');

        // Here you can send the data to your backend worker or API
        const formData = { name, email, phone, rating, feedback };
        console.log("Feedback Submitted:", formData);

        // Transition to Thank You View
        feedbackForm.classList.add('hidden');
        thankyouState.classList.remove('hidden');
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
    }
});
