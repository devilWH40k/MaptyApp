'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Selected elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Global variables
let map, mapEvent;

navigator.geolocation.getCurrentPosition(
    function (position) {
        const { latitude, longitude } = position.coords;

        // user geolocation
        const coords = [latitude, longitude];

        // L.map(<id of map div>) L - namespace with a couple of methods
        map = L.map('map').setView(coords, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // handling clicks on map
        map.on('click', function (mapE) {
            mapEvent = mapE;
            form.classList.remove('hidden');
            inputDistance.focus();
        });
    },
    function () {
        alert('Could not get your position');
    }
);

form.addEventListener('submit', function (e) {
    e.preventDefault();

    // clear input fields
    inputDistance.value =
        inputDuration.value =
        inputCadence.value =
        inputElevation.value =
            '';

    // display marker
    const markerCoords = Object.values(mapEvent.latlng);

    const markerPopup = L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        className: 'running-popup',
    });

    L.marker(markerCoords)
        .addTo(map)
        .bindPopup(markerPopup)
        .setPopupContent('Workout')
        .openPopup();

    // hiding the form
    form.classList.add('hidden');
});

inputType.addEventListener('change', function () {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
