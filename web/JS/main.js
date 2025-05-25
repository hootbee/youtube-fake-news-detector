document.addEventListener('DOMContentLoaded', function () {
    const slide = document.querySelector('.f-slide');
    const slides = document.querySelectorAll('.f-slide .f-item');
    const prevBtn = document.querySelector('.f-button.prev');
    const nextBtn = document.querySelector('.f-button.next');
    const dots = document.querySelectorAll('.dot');

    let currentIndex = 0;

    function updateSlider(index) {
        slide.style.transform = `translateX(-${index * 100}%)`;

        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
    }

    prevBtn.addEventListener('click', function () {
        currentIndex = (currentIndex === 0) ? slides.length - 1 : currentIndex - 1;
        updateSlider(currentIndex);
    });

    nextBtn.addEventListener('click', function () {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider(currentIndex);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateSlider(currentIndex);
        });
    });

    updateSlider(currentIndex);
});

