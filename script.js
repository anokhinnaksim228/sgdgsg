document.addEventListener('DOMContentLoaded', () => {
    // --- Carousel Logic ---
    const track = document.querySelector('.carousel-track');
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');
    const container = document.querySelector('.carousel-container');

    let slides = [];
    let currentIndex = 0;
    let effectiveSlideWidth = 0;
    let containerWidth = 0;
    let isCarouselInitialized = false;

    const initCarouselElements = () => {
        if (!track || !nextButton || !prevButton || !container) {
            console.error("Carousel elements not found");
            return false;
        }
        // Slides are now anchor tags, get them directly
        slides = Array.from(track.querySelectorAll('.slide'));
        if (slides.length === 0) {
            console.error("No slides found in the carousel track.");
            return false;
        }
        return true;
    };

    const calculateDimensions = () => {
        if (slides.length > 0 && slides[0].offsetWidth > 0) {
            const slideStyle = window.getComputedStyle(slides[0]);
            const slideWidth = slides[0].offsetWidth;
            const slideMarginLeft = parseFloat(slideStyle.marginLeft);
            const slideMarginRight = parseFloat(slideStyle.marginRight);
            effectiveSlideWidth = slideWidth + slideMarginLeft + slideMarginRight;
        } else {
            console.warn("Slide width is zero, layout might not be ready or slides are hidden.");
            effectiveSlideWidth = 0; // Indicate recalc needed
        }
        containerWidth = container.offsetWidth;
    };

    const moveToSlide = (targetIndex) => {
        if (!isCarouselInitialized || effectiveSlideWidth === 0) {
             console.warn("Attempted to move slide before initialization or dimensions ready.");
            if (effectiveSlideWidth === 0) calculateDimensions(); // Try recalculating
            if (effectiveSlideWidth === 0) {
                 console.error("Cannot move slide, dimensions calculation failed.");
                 return; // Still no dimensions, abort
            }
        }

        // Bounds check
        targetIndex = Math.max(0, Math.min(targetIndex, slides.length - 1));

        const targetSlideCenterOffset = (targetIndex * effectiveSlideWidth) + (effectiveSlideWidth / 2);
        const containerCenter = containerWidth / 2;
        const amountToMove = targetSlideCenterOffset - containerCenter;

        track.style.transform = `translateX(-${amountToMove}px)`;

        // Update active class on the *slide link* instead of the child div if needed for styling
         slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === targetIndex);
         });
        currentIndex = targetIndex;
        updateNavButtons();
    };

    const updateNavButtons = () => {
        if (!prevButton || !nextButton) return;
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === slides.length - 1;
    };

    const initializeCarousel = () => {
        if (!initCarouselElements()) return; // Ensure elements exist

        calculateDimensions();
        if (effectiveSlideWidth > 0 && containerWidth > 0) {
            isCarouselInitialized = true;
            moveToSlide(Math.floor(slides.length / 2)); // Start near the middle
            // Ensure transition is enabled after initial positioning
             setTimeout(() => {
                 if(track) track.style.transition = 'transform 0.5s ease-in-out';
             }, 50);
        } else {
            console.warn("Initial dimension calculation failed, retrying...");
            setTimeout(initializeCarousel, 150); // Retry after a longer delay
        }
    };

    if (nextButton && prevButton) {
        nextButton.addEventListener('click', () => {
            if (currentIndex < slides.length - 1) {
                moveToSlide(currentIndex + 1);
            }
        });

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                moveToSlide(currentIndex - 1);
            }
        });
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!isCarouselInitialized || !track) return; // Don't resize if not init or track gone

            const oldEffectiveWidth = effectiveSlideWidth;
            calculateDimensions();

            if (effectiveSlideWidth > 0 && effectiveSlideWidth !== oldEffectiveWidth) {
                track.style.transition = 'none'; // Disable transition for instant update
                moveToSlide(currentIndex); // Recenter current slide
                // Re-enable transition after rendering
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if(track) track.style.transition = 'transform 0.5s ease-in-out';
                    });
                });
            } else if (effectiveSlideWidth === 0) {
                console.warn("Resize calculation failed.");
            }
        }, 250); // Adjust debounce delay as needed
    });

    initializeCarousel();
});