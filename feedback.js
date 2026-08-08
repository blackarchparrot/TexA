document.addEventListener('DOMContentLoaded', () => {
  
    const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/649vd8jib23jz';

    let allReviews = [];

  
    function getUserReactions() {
        return JSON.parse(localStorage.getItem('texa_reactions') || '{}');
    }

    function saveUserReaction(key, value) {
        const reactions = getUserReactions();
        if (value) {
            reactions[key] = value;
        } else {
            delete reactions[key];
        }
        localStorage.setItem('texa_reactions', JSON.stringify(reactions));
    }

  
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    body.className = savedTheme;
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-theme');
        const newTheme = isDark ? 'light-theme' : 'dark-theme';
        body.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'light-theme' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

  
    async function fetchReviews() {
        const reviewsContainer = document.getElementById('reviewsContainer');
        try {
            const res = await fetch(SHEETDB_API_URL);
            if (!res.ok) throw new Error("Failed to load reviews");
            const data = await res.json();

  
            allReviews = Array.isArray(data) ? data.reverse() : [];
            
            calculateAndRenderStats(allReviews);
            renderReviewsList(allReviews);
        } catch (err) {
            console.error("Error fetching reviews:", err);
            reviewsContainer.innerHTML = `<p class="error-msg">Unable to load reviews. Please check your connection.</p>`;
            document.getElementById('totalReviewsCount').textContent = '0 ratings';
            document.getElementById('avgScore').textContent = '0.0';
        }
    }

  
    function calculateAndRenderStats(reviews) {
        const total = reviews.length;
        const totalReviewsCount = document.getElementById('totalReviewsCount');
        const avgScore = document.getElementById('avgScore');
        const avgStarsRow = document.getElementById('avgStarsRow');

        if (total === 0) {
            avgScore.textContent = '0.0';
            totalReviewsCount.textContent = '0 ratings';
            [1, 2, 3, 4, 5].forEach(num => {
                document.getElementById(`bar${num}`).style.width = '0%';
            });
            return;
        }

        let sum = 0;
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        reviews.forEach(r => {
            const ratingVal = parseInt(r.rating) || 0;
            sum += ratingVal;
            if (counts[ratingVal] !== undefined) {
                counts[ratingVal]++;
            }
        });

        const average = (sum / total).toFixed(1);
        avgScore.textContent = average;
        totalReviewsCount.textContent = `${total} ${total === 1 ? 'rating' : 'ratings'}`;

        for (let i = 1; i <= 5; i++) {
            const pct = Math.round((counts[i] / total) * 100);
            document.getElementById(`bar${i}`).style.width = `${pct}%`;
        }

        let starsHTML = '';
        const numericAvg = parseFloat(average);
        for (let i = 1; i <= 5; i++) {
            if (numericAvg >= i) {
                starsHTML += '<i class="fa-solid fa-star"></i>';
            } else if (numericAvg >= i - 0.5) {
                starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
            } else {
                starsHTML += '<i class="fa-regular fa-star"></i>';
            }
        }
        avgStarsRow.innerHTML = starsHTML;
    }

  
    function renderReviewsList(reviews) {
        const container = document.getElementById('reviewsContainer');
        if (reviews.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-dim); font-size: 14px;">No reviews yet. Be the first to share your thoughts!</p>`;
            return;
        }

        const avatarColors = ['#6366f1', '#06b6d4', '#a855f7', '#10b981', '#f59e0b'];
        const userReactions = getUserReactions();

        container.innerHTML = reviews.map((r, index) => {
            const initial = r.name ? r.name.charAt(0).toUpperCase() : 'U';
            const bg = avatarColors[index % avatarColors.length];
            const ratingNum = parseInt(r.rating) || 5;

  
            const revLikes = parseInt(r.review_likes) || 0;
            const revDislikes = parseInt(r.review_dislikes) || 0;
            const repLikes = parseInt(r.reply_likes) || 0;
            const repDislikes = parseInt(r.reply_dislikes) || 0;

  
            const revKey = `rev_${r.name}_${index}`;
            const repKey = `rep_${r.name}_${index}`;

            const revUserVote = userReactions[revKey]; // 'like' or 'dislike'
            const repUserVote = userReactions[repKey];

            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                starsHTML += i <= ratingNum ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
            }

  
            const replyBlock = r.reply && r.reply.trim() !== '' ? `
                <div class="developer-reply">
                    <div class="reply-header">
                        <span class="reply-author"><i class="fa-solid fa-reply"></i> TexA Response</span>
                    </div>
                    <p class="reply-text">${escapeHTML(r.reply)}</p>
                    <div class="reaction-actions">
                        <button class="btn-reaction ${repUserVote === 'like' ? 'active-vote' : ''}" 
                                onclick="handleReaction(${index}, 'reply', 'like')">
                            <i class="fa-${repUserVote === 'like' ? 'solid' : 'regular'} fa-thumbs-up"></i> <span>${repLikes}</span>
                        </button>
                        <button class="btn-reaction ${repUserVote === 'dislike' ? 'active-vote' : ''}" 
                                onclick="handleReaction(${index}, 'reply', 'dislike')">
                            <i class="fa-${repUserVote === 'dislike' ? 'solid' : 'regular'} fa-thumbs-down"></i> <span>${repDislikes}</span>
                        </button>
                    </div>
                </div>
            ` : '';

            return `
                <div class="review-card">
                    <div class="user-info">
                        <div class="avatar" style="background: ${bg};">${initial}</div>
                        <div class="user-meta">
                            <span class="user-name">${escapeHTML(r.name)}</span>
                            <span class="review-date">${r.date || 'Recently'}</span>
                        </div>
                    </div>
                    <div class="user-rating">${starsHTML}</div>
                    <p class="review-text">${escapeHTML(r.feedback)}</p>
                    
                    <!-- Review Like/Dislike Buttons -->
                    <div class="reaction-actions">
                        <button class="btn-reaction ${revUserVote === 'like' ? 'active-vote' : ''}" 
                                onclick="handleReaction(${index}, 'review', 'like')">
                            <i class="fa-${revUserVote === 'like' ? 'solid' : 'regular'} fa-thumbs-up"></i> <span>${revLikes}</span>
                        </button>
                        <button class="btn-reaction ${revUserVote === 'dislike' ? 'active-vote' : ''}" 
                                onclick="handleReaction(${index}, 'review', 'dislike')">
                            <i class="fa-${revUserVote === 'dislike' ? 'solid' : 'regular'} fa-thumbs-down"></i> <span>${revDislikes}</span>
                        </button>
                    </div>

                    ${replyBlock}
                </div>
            `;
        }).join('');
    }

  
    window.handleReaction = async function(index, target, type) {
        const review = allReviews[index];
        if (!review) return;

        const voteKey = `${target === 'review' ? 'rev' : 'rep'}_${review.name}_${index}`;
        const userReactions = getUserReactions();
        const existingVote = userReactions[voteKey];

  
        if (existingVote === type) {
            return;
        }

        let colToIncrement = target === 'review' 
            ? (type === 'like' ? 'review_likes' : 'review_dislikes')
            : (type === 'like' ? 'reply_likes' : 'reply_dislikes');

        let colToDecrement = null;

  
        if (existingVote && existingVote !== type) {
            colToDecrement = target === 'review'
                ? (existingVote === 'like' ? 'review_likes' : 'review_dislikes')
                : (existingVote === 'like' ? 'reply_likes' : 'reply_dislikes');
        }

  
        review[colToIncrement] = (parseInt(review[colToIncrement]) || 0) + 1;
        if (colToDecrement) {
            review[colToDecrement] = Math.max(0, (parseInt(review[colToDecrement]) || 0) - 1);
        }

  
        saveUserReaction(voteKey, type);

  
        renderReviewsList(allReviews);

  
        try {
            const patchUrl = `${SHEETDB_API_URL}/name/${encodeURIComponent(review.name)}`;
            const updateData = {};
            updateData[colToIncrement] = review[colToIncrement];
            if (colToDecrement) {
                updateData[colToDecrement] = review[colToDecrement];
            }

            await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: updateData })
            });
        } catch (err) {
            console.error("Failed to sync reaction to SheetDB:", err);
        }
    };

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

  
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

  
    const stars = document.querySelectorAll('.star-icon');
    const ratingInput = document.getElementById('ratingInput');
    const ratingText = document.getElementById('ratingText');
    const labels = ['Tap stars to rate', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Very Good 😀', 'Excellent! 🤩'];

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            highlightStars(parseInt(this.getAttribute('data-value')), 'hover');
        });

        star.addEventListener('mouseout', () => stars.forEach(s => s.classList.remove('hover')));

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

    function setActiveStars(val) {
        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

  
    const feedbackForm = document.getElementById('feedbackForm');
    const errorMsg = document.getElementById('errorMsg');
    const thankYouState = document.getElementById('thankYouState');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnSubmitText = document.getElementById('btnSubmitText');

    feedbackForm.addEventListener('submit', async (e) => {
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

        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const newReviewObj = { 
            name, email, phone, rating, feedback, date: formattedDate, reply: "",
            review_likes: 0, review_dislikes: 0, reply_likes: 0, reply_dislikes: 0
        };

        btnSubmit.disabled = true;
        btnSubmitText.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Posting...`;

        try {
            const response = await fetch(SHEETDB_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: newReviewObj })
            });

            if (!response.ok) throw new Error("Failed to post review.");

            allReviews.unshift(newReviewObj);
            calculateAndRenderStats(allReviews);
            renderReviewsList(allReviews);

            feedbackForm.classList.add('hidden');
            thankYouState.classList.remove('hidden');

        } catch (err) {
            console.error("Submission Error:", err);
            showError("Could not submit review. Please try again.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmitText.textContent = "Post Review";
        }
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

    fetchReviews();
});
