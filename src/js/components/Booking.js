import {templates, select} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DataPicker from './DataPicker.js';


class Booking {
  constructor(container) {
    const thisBooking = this;
    thisBooking.render(container);
    thisBooking.initWidget();
  }
  render(container) {
    const thisBooking = this;
    thisBooking.container = container;
    thisBooking.dom = {};
    thisBooking.dom.wrapper = templates.bookingWidget();

    thisBooking.element = utils.createDOMFromHTML(thisBooking.dom.wrapper);

    thisBooking.dom.peopleAmount = thisBooking.element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.container.appendChild(thisBooking.element);

  }
  initWidget() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.datePicker = new DataPicker(thisBooking.dom.datePicker);
  }
}

export default Booking;