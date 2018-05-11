(function (root, returnDatepicker) {
	if (typeof exports === 'object') return module.exports = returnDatepicker();
	if (typeof define === 'function' && define.amd) return define(function () { return returnDatepicker() });
	return root.datepicker = returnDatepicker();
})(this, function () {
	'use strict';

  /*
    A small polyfill is only intended to satisfy
    the usage in this datepicker. #BecauseIE.
  */
	if (!Array.prototype.includes) {
		Array.prototype.includes = function (thing) {
			let found = false;
			this.forEach(item => {
				if (item === thing) found = true;
			});
			return found;
		}
	}

	let datepickers = [];
	const listeners = ['click', 'focusin', 'keydown', 'input'];
	const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
	const months = ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'];
	const monthsSelected = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

	function markInRangeDays(instance) {
		if (instance.ifRangeActive) {
			// remove old mark in-range days
			clearMarkInRangeDays(instance);
			const selectedDay = instance.calendar.querySelector('.calendar__datepicker-active');
			if (selectedDay) {
				selectedDay.classList.add('calendar__datepicker-active-range');
				const days = Array.from(instance.calendar.querySelectorAll('.calendar__datepicker-square.calendar__datepicker-num'));
				const selectedDayIndex = days.indexOf(selectedDay);
				let leftMarked;
				let rightMarked;
				for (let i = 1; i <= 3; i++) {
					if (i !== 3) {
						if (selectedDayIndex + i < days.length) {
							if (!days[selectedDayIndex + i].classList.contains('calendar__datepicker-disabled') &&
									!days[selectedDayIndex + i].classList.contains('calendar__datepicker-empty')) {
								days[selectedDayIndex + i].classList.add('calendar__datepicker-num-range');
							} else {
								if (!rightMarked) {
									rightMarked = true;
									days[selectedDayIndex + i - 1].classList.remove('calendar__datepicker-num-range');
									days[selectedDayIndex + i - 1].classList.add('calendar__datepicker-num-range-right');
								}
							}
						}

						if (selectedDayIndex - i > -1) {	
							if (!days[selectedDayIndex - i].classList.contains('calendar__datepicker-disabled') &&
									!days[selectedDayIndex - i].classList.contains('calendar__datepicker-empty')) {
								days[selectedDayIndex - i].classList.add('calendar__datepicker-num-range');
							} else {
								if (!leftMarked) {
									leftMarked = true;
									days[selectedDayIndex - i + 1].classList.remove('calendar__datepicker-num-range');
									days[selectedDayIndex - i + 1].classList.add('calendar__datepicker-num-range-left');	
								}
							}
						}
					} else {

						if (selectedDayIndex + i < days.length) {
							if (!days[selectedDayIndex + i].classList.contains('calendar__datepicker-disabled') &&
									!days[selectedDayIndex + i].classList.contains('calendar__datepicker-empty')) {
								days[selectedDayIndex + i].classList.add('calendar__datepicker-num-range-right');
							} else {
								if (!rightMarked) {
									days[selectedDayIndex + i - 1].classList.remove('calendar__datepicker-num-range');
									days[selectedDayIndex + i - 1].classList.add('calendar__datepicker-num-range-right');
								}
							}
						}

						if (selectedDayIndex - i > -1) {
							if (!days[selectedDayIndex - i].classList.contains('calendar__datepicker-disabled') &&
									!days[selectedDayIndex - i].classList.contains('calendar__datepicker-empty')) {
								days[selectedDayIndex - i].classList.add('calendar__datepicker-num-range-left');
							} else {
								if (!leftMarked) {
									days[selectedDayIndex - i + 1].classList.remove('calendar__datepicker-num-range');
									days[selectedDayIndex - i + 1].classList.add('calendar__datepicker-num-range-left');
								}
							}
						}
					}
				}
			}
		}
	}

	function clearMarkInRangeDays(instance) {
		const selectedDay = instance.calendar.querySelector('.calendar__datepicker-active-range');
		if (selectedDay) {
			selectedDay.classList.remove('calendar__datepicker-active-range');
			const days = Array.from(instance.calendar.querySelectorAll('.calendar__datepicker-square.calendar__datepicker-num'));
			const selectedDayIndex = days.indexOf(selectedDay);
			for (let i = 0; i <= 3; i++) {
				if (selectedDayIndex + i < days.length) {				
					days[selectedDayIndex + i].classList.remove('calendar__datepicker-num-range');
					days[selectedDayIndex + i].classList.remove('calendar__datepicker-num-range-right');
				}
				if (selectedDayIndex - i > -1) {
					days[selectedDayIndex - i].classList.remove('calendar__datepicker-num-range-left');
					days[selectedDayIndex - i].classList.remove('calendar__datepicker-num-range');
				}
			}
		}
	}

  /*
   *
   */
	function Datepicker(el, options) {
		if (!el || typeof(el) !== 'object') {
			console.error(`datepicker: el error, el equal ${el}, el is ${typeof(el)}`);
			return;
		}
		if (options) {
			options = sanitizeOptions(options || null, el);
		}
		const calendar = document.createElement('div');
		const dateSelected = new Date();
		let minDate = new Date();
		minDate.setDate(dateSelected.getDate() - 1);
		const instance = {
			// Where the calendar will be placed.
			el: el,

			// native date input
			input: null,

			// Starts the calendar with a date selected.
			dateSelected: dateSelected,

			// if range checkbox +- 3 days active
			ifRangeActive: null,

			// Low end of selectable dates.
			minDate: minDate,

			// The element our calendar is constructed in.
			calendar: calendar,

			// Month of `startDate` or `dateSelected` (as a number).
			currentMonth: dateSelected.getMonth(),

			// Month name in plain english - or not.
			currentMonthName: months[(dateSelected).getMonth()],

			// Year of `startDate` or `dateSelected`.
			currentYear: dateSelected.getFullYear(),

			// Method to programatically set the calendar's date.
			setDate: setDate,

			// Method to programatically reset the calendar.
			reset: reset,

			// Method that removes the calendar from the DOM along with associated events.
			remove: remove,

			// Callback fired when a date is selected - triggered in `selectDay`.
			onSelect: options ? options.onSelect : undefined,

			// Callback fired when the calendar is shown - triggered in `showCal`.
			onShow: options ? options.onShow : undefined,

			// Callback fired when the calendar is hidden - triggered in `hideCal`.
			onHide: options ? options.onHide : undefined,

			// Callback fired when the month is changed - triggered in `changeMonthYear`.
			onMonthChange: options ? options.onMonthChange : undefined,

			// Function to customize the date format updated on <input> elements - triggered in `setElValues`.
			formatter: options ? options.formatter : undefined,

			// Labels for months.
			months: months,

			// Labels for days.
			days: days,

			// Start day of the week - indexed from `days` above.
			startDay: 1,

			// Disable the datepicker on mobile devices.
			// Allows the use of native datepicker if the input type is 'date'.
			disableMobile: false,

			// Used in conjuntion with `disableMobile` above within `oneHandler`.
			isMobile: 'ontouchstart' in window
		};

		calendar.classList.add('calendar__datepicker');
		calendar.classList.add('calendar__datepicker-hidden');
		datepickers.push(el);
		calendarHtml(dateSelected, instance);

		listeners.forEach(e => { // Declared at the top.
			window.addEventListener(e, oneHandler.bind(instance));
		});

		el.appendChild(calendar);

		calendar.parentNode.querySelector('.calendar__selected-date').innerHTML = `${dateSelected.getDate()} ${monthsSelected[dateSelected.getMonth()]} ${dateSelected.getFullYear()}`;
		calendar.parentNode.querySelector('.calendar__three-days').innerHTML = '± 3 дня';

		const checkbox = calendar.querySelector('.calendar__datepicker-checkbox__input');
		checkbox.addEventListener('click', () => {
			instance.ifRangeActive = !instance.ifRangeActive;
			if (!instance.ifRangeActive) {
				clearMarkInRangeDays(instance);
			} else {
				markInRangeDays(instance);
			}
		});
		instance.ifRangeActive = checkbox.checked;

		instance.input = calendar.parentNode.querySelector('.calendar__input');

		// Initially populate the <input> field / set attributes on the `el`.
		if (dateSelected) setElValues(instance);

		return instance;
	}

  /*
   *  Will run checks on the provided options object to ensure correct types.
   *  Returns an options object if everything checks out.
   */
	function sanitizeOptions(options, el) {
		// Check if the provided element already has a datepicker attached.
		if (datepickers.includes(el)) throw new Error('A datepicker already exists on that element.');

		let {
			minDate,
			dateSelected,
			formatter,
		} = options;

		// Callbacks.
		['onSelect', 'onShow', 'onHide', 'onMonthChange'].forEach(fxn => {
			options[fxn] = typeof options[fxn] === 'function' && options[fxn];
		});

		return options;
	}

  /*
   *  Populates `calendar.innerHTML` with the contents
   *  of the calendar controls, month.
   */
	function calendarHtml(date, instance) {
		const controls = createControls(date, instance);
		const month = createMonth(date, instance);
		const checkbox = createCheckbox();
		instance.calendar.innerHTML = controls + month + checkbox;
	}

	/*
   *  Creates the calendar range checkbox.
   *  Returns a string representation of DOM elements.
   */
	function createCheckbox() {
		return `
			<label class="calendar__datepicker-checkbox">
				<input type="checkbox" checked class="calendar__datepicker-checkbox__input" id="id-calendar__datepicker-checkbox">
				<span class="calendar__datepicker-checkbox__custom"></span>
				<span class="calendar__datepicker-checkbox__label">± 3 дня</span>
			</label>
    `;
	}

  /*
   *  Creates the calendar controls.
   *  Returns a string representation of DOM elements.
   */
	function createControls(date, instance) {
		return `
      <div class="calendar__datepicker-controls">
        <div class="calendar__datepicker-arrow calendar__datepicker-left"></div>
        <div class="calendar__datepicker-month-year">
          <span class="calendar__datepicker-month">${instance.months[date.getMonth()]}</span>
          <span class="calendar__datepicker-year">${date.getFullYear()}</span>
        </div>
        <div class="calendar__datepicker-arrow calendar__datepicker-right"></div>
      </div>
    `;
	}

  /*
   *  Creates the calendar month structure.
   *  Returns a string representation of DOM elements.
   */
	function createMonth(date, instance) {
		const {
			minDate,
			dateSelected,
			currentYear,
			currentMonth,
			days
		} = instance;

		// Same year, same month?
		const today = new Date();
		const isThisMonth = today.toJSON().slice(0, 7) === date.toJSON().slice(0, 7);

		// Calculations for the squares on the calendar.
		const copy = new Date(new Date(date).setDate(1));
		const offset = copy.getDay() - instance.startDay; // Preceding empty squares.
		const precedingRow = offset < 0 ? 7 : 0; // Offsetting the start day may move back to a new 1st row.
		copy.setMonth(copy.getMonth() + 1);
		copy.setDate(0); // Last day in the current month.
		const daysInMonth = copy.getDate(); // Squares with a number.

		// Will contain string representations of HTML for the squares.
		const calendarSquares = [];

		// Fancy calculations for the total # of squares.
		let totalSquares = precedingRow + (((offset + daysInMonth) / 7 | 0) * 7);
		totalSquares += (offset + daysInMonth) % 7 ? 7 : 0;

		// If the offest happens to be 0 but we did specify a `startDay`,
		// add 7 to prevent a missing row at the end of the calendar.
		if (instance.startDay !== 0 && offset === 0) totalSquares += 7;

		for (let i = 1; i <= totalSquares; i++) {
			const weekday = days[(i - 1) % 7];
			const num = i - (offset >= 0 ? offset : (7 + offset));
			const thisDay = new Date(currentYear, currentMonth, num);
			const isEmpty = num < 1 || num > daysInMonth;
			let otherClass = '';
			let span = `<span class="calendar__datepicker-num">${num}</span>`;

			// Empty squares.
			if (isEmpty) {
				otherClass = 'calendar__datepicker-empty';
				span = '';

				// Disabled & current squares.
			} else {
				let disabled = (minDate && thisDay < minDate);
				const sat = days[6];
				const sun = days[0];
				const currentValidDay = isThisMonth && !disabled && num === today.getDate();

				otherClass = disabled ? 'calendar__datepicker-disabled' : currentValidDay ? 'calendar__datepicker-current' : '';
			}

			// Currently selected day.
			if (+thisDay === +dateSelected && !isEmpty) otherClass += ' calendar__datepicker-active';

			calendarSquares.push(`<div class="calendar__datepicker-square calendar__datepicker-num ${weekday} ${otherClass}">${span}</div>`);
		}

		// Add the header row of days of the week.
		const daysAndSquares = days.map(day => {
			return `<div class="calendar__datepicker-square calendar__datepicker-day">${day}</div>`;
		}).concat(calendarSquares);

		// Wrap it all in a tidy div.
		daysAndSquares.unshift('<div class="calendar__datepicker-squares">');
		daysAndSquares.push('</div>');
		return daysAndSquares.join('');
	}

  /*
   *  Highlights the selected date.
   *  Calls `setElValues`.
   */
	function selectDay(target, instance) {
		const { currentMonth, currentYear, calendar, el, onSelect } = instance;
		const active = calendar.querySelector('.calendar__datepicker-active');
		const num = target.textContent;
		// Keep track of the currently selected date.
		instance.dateSelected = new Date(currentYear, currentMonth, num);

		instance.calendar.parentNode.querySelector('.calendar__selected-date').innerHTML = `${num} ${monthsSelected[currentMonth]} ${currentYear}`;

		// Re-establish the active (highlighted) date.
		if (active) active.classList.remove('calendar__datepicker-active');
		target.classList.add('calendar__datepicker-active');

		// new mark in-range days
		console.log(instance);
		if (instance.ifRangeActive) {
			markInRangeDays(instance);
		}

		// Populate the <input> field (or not) with a readble value
		// and store the individual date values as attributes.
		setElValues(instance);

		// // Hide the calendar after a day has been selected.
		// hideCal(instance);

		// Call the user-provided `onSelect` callback.
		onSelect && onSelect(instance);
	}

  /*
   *  Populates the <input> fields with a readble value
   *  and stores the individual date values as attributes.
   */
	function setElValues(instance) {
		if (instance.formatter) return instance.formatter(instance.input, instance.dateSelected);
		const year = instance.dateSelected.getFullYear();
		const month = instance.dateSelected.getMonth() + 1;
		const zeroBeforeMonth = month < 10 ? 0 : '';
		const date = instance.dateSelected.getDate();
		const zeroBeforeDate = date < 10 ? 0 : '';
		instance.input.value = `${year}-${zeroBeforeMonth}${month}-${zeroBeforeDate}${date}`;
	}

  /*
   *  Updates `this.currentMonth` & `this.currentYear` based on right or left arrows.
   *  Creates a `newDate` based on the updated month & year.
   *  Calls `calendarHtml` with the updated date.
   */
	function changeMonthYear(classList, instance, year) {
		// Overlay.
		if (year) {
			instance.currentYear = year;

			// Month change.
		} else {
			instance.currentMonth += classList.contains('calendar__datepicker-right') ? 1 : -1;

			// Month = 0 - 11
			if (instance.currentMonth === 12) {
				instance.currentMonth = 0;
				instance.currentYear++
			} else if (instance.currentMonth === -1) {
				instance.currentMonth = 11;
				instance.currentYear--;
			}
		}

		const newDate = new Date(instance.currentYear, instance.currentMonth, 1);
		calendarHtml(newDate, instance);
		instance.currentMonthName = instance.months[instance.currentMonth];
		instance.onMonthChange && year && instance.onMonthChange(instance);


		console.log(instance);
		// console.log(instance.dateSelected.getMonth());
		// console.log(instance.dateSelected.getFullYear());
		// console.log(instance.currentYear);
		// console.log(instance.currentMonth);

		if (instance.dateSelected.getMonth() === instance.currentMonth &&
				instance.dateSelected.getFullYear() === instance.currentYear) {
					clearMarkInRangeDays(instance);
					markInRangeDays(instance);
		}
		const checkbox = instance.calendar.querySelector('.calendar__datepicker-checkbox__input');
		checkbox.addEventListener('click', () => {
			instance.ifRangeActive = !instance.ifRangeActive;
			if (!instance.ifRangeActive) {
				clearMarkInRangeDays(instance);
				instance.calendar.parentNode.querySelector('.calendar__three-days').classList.remove('calendar__three-days_hidden');
			} else {
				markInRangeDays(instance);
				instance.calendar.parentNode.querySelector('.calendar__three-days').classList.addClass('calendar__three-days_hidden');
			}
		});
		if (!instance.ifRangeActive) {
			checkbox.checked = false;
		}
	}

  /*
   *  Sets the `style` attribute on the calendar after doing calculations.
   */
	function calculatePosition(instance) {
		const { el, calendar } = instance;

		const elRect = el.getBoundingClientRect();

		const style = `
      top:${elRect.height}px;
      left: 0px;
    `;

		calendar.setAttribute('style', style);
	}

  /*
   *  Method that programatically sets the date.
   */
	function setDate(date, reset) {
		date = stripTime(date); // Remove the time.
		this.currentYear = date.getFullYear();
		this.currentMonth = date.getMonth();
		this.currentMonthName = this.months[date.getMonth()];
		this.dateSelected = reset ? undefined : date;
		!reset && setElValues(this);
		calendarHtml(date, this);
		if (reset) this.input.value = '';
	}

	function reset() {
		this.setDate(this.startDate, true);
	}

  /*
   *  Takes a date and returns a date stripped of its time (hh:mm:ss:ms).
   */
	function stripTime(date) {
		return new Date(date.toDateString());
	}

  /*
   *  Removes all event listeners added by the constructor.
   *  Removes the current instance from the array of instances.
   */
	function remove() {
		const { calendar, parent, el } = this;

		// Remove event listeners (declared at the top).
		listeners.forEach(e => {
			window.removeEventListener(e, oneHandler);
		});

		calendar.remove();

		// Remove this datepicker's `el` from the list.
		datepickers = datepickers.filter(dpEl => dpEl !== el);
	}

  /*
   *  Hides the calendar and calls the `onHide` callback.
   */
	function hideCal(instance) {
		instance.calendar.classList.add('calendar__datepicker-hidden');
		instance.calendar.parentNode.classList.remove('open');
		instance.onHide && instance.onHide(instance);
	}

  /*
   *  Shows the calendar and calls the `onShow` callback.
   */
	function showCal(instance) {
		instance.calendar.classList.remove('calendar__datepicker-hidden');
		instance.calendar.parentNode.classList.add('open');
		calculatePosition(instance);
		instance.onShow && instance.onShow(instance);
	}


	/////////////////////
	// EVENT FUNCTIONS //
	/////////////////////

  /*
   *  Handles `click` events when the calendar's `el` is an <input>.
   *  Handles `focusin` events for all other types of `el`'s.
   *  Handles `keyup` events when tabbing.
   */
	function oneHandler(e) {
		if (this.isMobile && this.disableMobile) return;

		// Add `e.path` if it doesn't exist.
		if (!e.path) {
			let node = e.target;
			let path = [];

			while (node !== document) {
				path.push(node);
				node = node.parentNode;
			}

			e.path = path;
		}

		const { type, path, target } = e;
		const { calendar, el } = this;
		const calClasses = calendar.classList;
		const hidden = calClasses.contains('calendar__datepicker-hidden');
		const onCal = path.includes(calendar);

		// Only pay attention to `focusin` events if the calendar's el is an <input>.
		// `focusin` bubbles, `focus` does not.
		if (type === 'focusin') return target === el && showCal(this);

		if (hidden) {
			target === el && showCal(this);
			// Clicked on the calendar.
		} else if (type === 'click' && onCal) {
			calendarClicked(this);
		} else {
			hideCal(this);
		}

		function calendarClicked(instance) {
			const { calendar } = instance;
			const classList = target.classList;
			const monthYear = calendar.querySelector('.calendar__datepicker-month-year');
			const isClosed = classList.contains('calendar__datepicker-close');

			// A number was clicked.
			if (classList.contains('calendar__datepicker-num')) {
				const targ = target.nodeName === 'SPAN' ? target.parentNode : target;
				const doNothing = ['calendar__datepicker-disabled', 'calendar__datepicker-active', 'calendar__datepicker-empty'].some(cls => {
					return targ.classList.contains(cls);
				});

				!doNothing && selectDay(targ, instance);

				// Month arrows were clicked.
			} else if (classList.contains('calendar__datepicker-arrow')) {
				changeMonthYear(classList, instance);
			}
		}
	}

	return Datepicker;
});
