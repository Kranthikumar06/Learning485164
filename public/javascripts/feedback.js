const stars = document.querySelectorAll('.rating span');
const ratingInput = document.getElementById('ratingValue');
let currentRating = 0;

stars.forEach((star, index) => {
    star.addEventListener('mouseover', () => {
        stars.forEach((s, i) => {
            s.classList.toggle('hovered', i <= index);
        });
    });

    star.addEventListener('mouseout', () => {
        stars.forEach((s, i) => {
            s.classList.toggle('hovered', i < currentRating);
        });
    });

    star.addEventListener('click', () => {
        currentRating = index + 1;
        if (ratingInput) {
            ratingInput.value = currentRating;
        }
        stars.forEach((s, i) => {
            s.classList.toggle('active', i < currentRating);
        });
    });
});