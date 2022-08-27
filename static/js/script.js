'use strict';

// prettier-ignore
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    #mapZoomLevel = 15;
    #workouts = [];

    constructor() {
        // getting position and loading the map
        this._getPosition();

        // get data from local storage
        this._getLocalStorage();

        // attaching Event Listeners
        form.addEventListener('submit', this._newWorkout.bind(this));

        // changing input field (from pace to elevation)
        inputType.addEventListener('change', this._toggleElevationField);

        // rendering workout list click
        containerWorkouts.addEventListener(
            'click',
            this._moveToMarker.bind(this)
        );
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
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        // map should be loaded before rendering the markers from the local storage
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
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
        this.#workouts.push(workout);

        // Render workout on a map as a marker
        this._renderWorkoutMarker(workout);

        // Render workout on a list
        this._renderWorkout(workout);

        // clear input fields and hide a form
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();
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
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
                    workout.description
                }`
            )
            .openPopup();
    }

    _renderWorkout(workout) {
        const workoutHTML = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${
                    workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${(workout.type === 'running'
                    ? workout.pace
                    : workout.speed
                ).toFixed(2)}
                </span>
                <span class="workout__unit">${
                    workout.type === 'running' ? 'min/km' : 'km/h'
                }</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">${
                    workout.type === 'running' ? '🦶🏼' : '⛰'
                }</span>
                <span class="workout__value">${
                    workout.type === 'running'
                        ? workout.cadence
                        : workout.elevationGain
                }</span>
                <span class="workout__unit">${
                    workout.type === 'running' ? 'spm' : 'm'
                }</span>
            </div>
        </li>
        `;

        form.insertAdjacentHTML('afterend', workoutHTML);
    }

    _moveToMarker(e) {
        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        const workoutCoords = workout.coords;
        this.#map.setView(workoutCoords, this.#mapZoomLevel, {
            animate: true,
            duration: 1,
        });
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const workoutsData = JSON.parse(localStorage.getItem('workouts'));

        if (!workoutsData) return;

        this.#workouts = workoutsData;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    resetLocalStorage() {
        localStorage.removeItem('workouts');
        location.reload();
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

    _setDescription() {
        const workoutDate = this.date;
        const workoutType = this.type;
        const typeCapitalized = workoutType.replace(
            workoutType[0],
            workoutType[0].toUpperCase()
        );

        const workoutDesc = `${typeCapitalized} on ${
            MONTHS[workoutDate.getMonth()]
        } ${this.date.getDate()}
        `;

        this.description = workoutDesc;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.pace = this.duration / this.distance;

        this._setDescription();
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.speed = this.distance / (this.duration / 60);

        this._setDescription();
    }
}

const app = new App();
