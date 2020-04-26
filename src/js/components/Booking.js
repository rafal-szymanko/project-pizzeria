import {templates, select, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DataPicker from './DataPicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(container) {
    const thisBooking = this;
    thisBooking.render(container);
    thisBooking.getElement();
    thisBooking.initWidget();
    thisBooking.getData();
    thisBooking.initAction();
  }
  render(container) {
    const thisBooking = this;
    thisBooking.container = container;
    thisBooking.dom = {};
    thisBooking.dom.wrapper = templates.bookingWidget();
    thisBooking.element = utils.createDOMFromHTML(thisBooking.dom.wrapper);
    thisBooking.container.appendChild(thisBooking.element);
  }

  getElement() {
    const thisBooking = this;

    
    thisBooking.dom.peopleAmount = thisBooking.element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.element.querySelector(select.booking.hoursAmount);
    
    thisBooking.dom.datePicker = thisBooking.element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.element.querySelector(select.widgets.hourPicker.wrapper);
    
    thisBooking.dom.tables = thisBooking.element.querySelectorAll(select.booking.tables);
    
    thisBooking.dom.form = thisBooking.element.querySelector(select.booking.form);
    thisBooking.dom.phone = thisBooking.element.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.element.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.element.querySelectorAll(select.booking.starters);

  }

  initWidget() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DataPicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.container.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });


  }

  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponse){
        const bookingResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeatResponse]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeatResponse);
        thisBooking.currentlyBookings = bookings;
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }


    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;


    if(typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    
    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
      
    }
    
  }

  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(typeof thisBooking.booked[thisBooking.date] == 'undefined'
    || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    thisBooking.renderInputColor();

  }

  initAction() {
    const thisBooking = this;
    

    thisBooking.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
    thisBooking.dom.address.addEventListener('change', function() {
      thisBooking.address = thisBooking.dom.address.value;
    });
    thisBooking.dom.phone.addEventListener('change', function() {
      thisBooking.phone = thisBooking.dom.phone.value;
    });

    thisBooking.hourPicker.dom.input.addEventListener('change', function(){
      for(let table of thisBooking.dom.tables) {
        table.classList.remove('activeTable');
        thisBooking.tableId = undefined;
      }
    });

    thisBooking.datePicker.dom.input.addEventListener('change', function(){
      for(let table of thisBooking.dom.tables) {
        table.classList.remove('activeTable');
        thisBooking.tableId = undefined;
      }
    });


    for(let table of thisBooking.dom.tables) {
      table.addEventListener('click', function(event){

        if(table.classList.contains('booked')){
          alert('Stolik jest zarezerwowany');
          return;
        }

        for(let table of thisBooking.dom.tables) {
          table.classList.remove('activeTable');
        }

        event.target.classList.add('activeTable');

        let tableId = table.getAttribute(settings.booking.tableIdAttribute);        
        if(!isNaN(tableId)){
          tableId = parseInt(tableId);
        }
        thisBooking.tableId = tableId;
      });

    }

    thisBooking.startersArray = [];

    for (let starter of thisBooking.dom.starters) {
      starter.addEventListener('change', function(){
        if(starter.checked) {
          thisBooking.startersArray.push(starter.value);
        } else {
          thisBooking.startersArray.splice(starter.value);
        }
      });
    }
  }

  renderInputColor() {  
    const thisBooking =this;

    const booked = thisBooking.booked[thisBooking.date];
    thisBooking.dom.rangeSlider = thisBooking.element.querySelector('.rangeSlider');
    const slice = 100/12;
    let gradientGreen = [];
    let gradientOrange = [];
    let gradientRed = [];

    for (let i = 0; i<= 12; i += 0.5) {
      const start = slice * i;
      const end = slice *(i + 0.5);

      const green = `green`;
      const red = `red`;
      const orange = `orange`;

      let bookingHours = booked[i+12];

      if(typeof bookingHours == 'undefined') {
        bookingHours = [];   
      } else if (bookingHours.length == 1 || bookingHours.length == 0){
        const  gradient = [`${green} ${start}% , ${green} ${end}% `];
        gradientGreen = [...gradientGreen, ...gradient];
      } else if (bookingHours.length == 2) {
        const  gradient = [`${orange} ${start}% , ${orange} ${end}% `];
        gradientOrange = [...gradientOrange, ...gradient];
      } else if (bookingHours.length == 3) {
        const  gradient = [`${red} ${start}% , ${red} ${end}% `];
        gradientRed = [...gradientRed, ...gradient];
      }
    }

    let inputGradientArray = [...gradientRed, ...gradientGreen, ...gradientOrange];
    let inputGradientSort = inputGradientArray.sort(function(a,b) {
      return (Number(a.match(/(\d+)/g)[0]) - Number((b.match(/(\d+)/g)[0])));
    });

    const inputGradientColor = inputGradientSort.toString();

    thisBooking.dom.rangeSlider.style.background =
     `linear-gradient(90deg, ${inputGradientColor})`;
  }

  
  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table : thisBooking.tableId,
      repeat: false,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: thisBooking.startersArray,
      address: thisBooking.address,
      phoneNumber: thisBooking.phone,

    };   

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    

    for (let currentlyBooking of thisBooking.currentlyBookings) {

      if (currentlyBooking.date == payload.date 
        && currentlyBooking.hour == payload.hour
        && currentlyBooking.table == payload.table){
        return alert(`Błąd rezerwacji. Rezerwacja stolika ${payload.table} na dzień ${payload.date} na godzinę ${currentlyBooking.hour} znajduje się już w systemie.`);
      }
    }

    if(payload.table !== undefined){
      
      fetch(url, options)
        .then(function(response) {
          return response.json();
        }).then(function(parsedResponse){
          console.log(parsedResponse);
          thisBooking.getData();
          alert(`Pomyślnie zarezerwowano stolik nr ${parsedResponse.table}, na dzień ${parsedResponse.date} na godzinę ${parsedResponse.hour}`);
        }); 
    } else {
      alert('Nie został wybrany żaden z dostępnych stolików');
    }

  }
}

export default Booking;