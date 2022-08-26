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

// APLICATION
class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        // getting position and loading the map
        this._getPosition();

        // attaching Event Listeners
        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your position');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;

        // user geolocation
        const coords = [latitude, longitude];

        // L.map(<id of map div>) L - namespace with a couple of methods
        this.#map = L.map('map').setView(coords, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // handling clicks on map
        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField() {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInput = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);

        // workout obj
        let workout;

        // gettin coords for a marker
        const markerCoords = Object.values(this.#mapEvent.latlng);

        // running or cycling
        if (type === 'running') {
            const cadence = Number(inputCadence.value);

            // Check if data is correct Number
            if (
                !validInput(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be positive numbers!');

            workout = new Running(markerCoords, distance, duration, cadence);
        }

        if (type === 'cycling') {
            const elevationGain = Number(inputElevation.value);

            // Check if data is valid
            if (
                !validInput(distance, duration, elevationGain) ||
                !allPositive(distance, duration)
            )
                return alert('Inputs have to be positive numbers!');

            workout = new Cycling(
                markerCoords,
                distance,
                duration,
                elevationGain
            );
        }

        // add new object to workout array
        console.log(workout);
        this.#workouts.push(workout);

        // Render workout on a map as a marker
        this._renderWorkoutMarker(workout);

        // Render workout on a list

        // clear input fields and hide a form
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';

        form.classList.add('hidden');
    }

    _renderWorkoutMarker(workout) {
        const markerPopup = L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            closeButton: false,
            className: `${workout.type}-popup`,
        });

        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(markerPopup)
            .setPopupContent(workout.distance + '')
            .openPopup();
    }
}

// WORKOUTS
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        // this.date = ...
        // this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance;
        this.duration = duration;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
    }

    get pace() {
        // min/km
        return this.duration / this.distance;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
    }

    get speed() {
        // km/h
        return this.distance / (this.duration / 60);
    }
}

const app = new App();
console.log(app);

const run1 = new Running([39, -12], 5.2, 24, 178);
const run2 = new Running([39, -12.08], 9, 40, 150);

const cycling1 = new Cycling([23, -6], 17, 120, 523);
