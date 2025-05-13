document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    const reviewsList = document.getElementById('reviews-list');
    const movieIdInput = document.getElementById('movie-id');
    const reviewApiUrl = 'reviews.php';

    if (!reviewForm || !reviewsList || !movieIdInput) {
        console.error("Required elements for review management are missing.");
        const reviewsSection = document.querySelector('.reviews-section');
        if (reviewsSection) {
            reviewsSection.innerHTML = '<p>Ошибка загрузки раздела отзывов.</p>';
        }
        return;
    }

    const movieId = movieIdInput.value;

  
    const loadReviews = async () => {
        reviewsList.innerHTML = '<p>Загрузка отзывов...</p>';

        try {
            const response = await fetch(`${reviewApiUrl}?movieId=${encodeURIComponent(movieId)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                 
                 let errorMsg = `HTTP error! Status: ${response.status}`;
                 try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                 } catch(e) {}
                throw new Error(errorMsg);
            }

            const data = await response.json();

            if (data.status === 'success') {
                displayReviews(data.reviews);
            } else {
                throw new Error(data.message || 'Failed to load reviews.');
            }

        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsList.innerHTML = `<p>Не удалось загрузить отзывы: ${error.message}</p>`;
        }
    };

    const displayReviews = (reviews) => {
        reviewsList.innerHTML = '';

        if (!reviews || reviews.length === 0) {
            reviewsList.innerHTML = '<p>Пока нет отзывов. Будьте первым!</p>';
        } else {
            reviews.slice().reverse().forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.classList.add('review');

                const nameElement = document.createElement('strong');
                nameElement.textContent = review.name || 'Аноним';

                const textElement = document.createElement('p');
                textElement.textContent = review.text || '';

                reviewElement.appendChild(nameElement);
                reviewElement.appendChild(textElement);

                if (review.timestamp) {
                    const timeElement = document.createElement('small');
                    timeElement.style.display = 'block';
                    timeElement.style.marginTop = '5px';
                    timeElement.style.color = '#aaa';
                    try {
                       timeElement.textContent = `Добавлено: ${new Date(review.timestamp).toLocaleString()}`;
                    } catch (e) {
                       timeElement.textContent = `Добавлено: ${review.timestamp}`; // Fallback
                    }
                    reviewElement.appendChild(timeElement);
                }

                reviewsList.appendChild(reviewElement);
            });
        }
    };


    reviewForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const reviewerNameInput = document.getElementById('reviewer-name');
        const reviewTextInput = document.getElementById('review-text');
        const submitButton = reviewForm.querySelector('button[type="submit"]');

        const reviewerName = reviewerNameInput.value.trim();
        const reviewText = reviewTextInput.value.trim();

        if (!reviewerName || !reviewText) {
            alert("Пожалуйста, заполните все поля отзыва.");
            return;
        }

        const reviewData = {
            movieId: movieId,
            name: reviewerName,
            review: reviewText
        };


        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';

        try {
            const response = await fetch(reviewApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(reviewData)
            });

            const result = await response.json();

            if (!response.ok) {
                 throw new Error(result.message || `HTTP error! Status: ${response.status}`);
            }


            if (result.status === 'success') {
                reviewerNameInput.value = '';
                reviewTextInput.value = '';
                await loadReviews();
            } else {
                throw new Error(result.message || 'Failed to submit review.');
            }

        } catch (error) {
            console.error('Error submitting review:', error);
            alert(`Не удалось отправить отзыв: ${error.message}`);
        } finally {
             submitButton.disabled = false;
             submitButton.textContent = 'Отправить';
        }
    });

    loadReviews();
});