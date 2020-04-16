import {settings, select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.getElements(element);
    thisCart.initAction();
  }

  getElements(element) {
    const thisCart =this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phoneNumber = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);


    thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

    for(let key of thisCart.renderTotalsKeys){
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
      
    }
  }
  initAction() {
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function() {
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisCart.sendOrder();
      console.log('klik');
    });
    thisCart.dom.phoneNumber.addEventListener('change', function() {
      thisCart.phoneNumber = thisCart.dom.phoneNumber.value;
    });
    thisCart.dom.address.addEventListener('change', function() {
      thisCart.address = thisCart.dom.address.value;
    });
  }

  add(menuProduct) {
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }

  update() {
    const thisCart = this;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    if (thisCart.products.length == 0) {
      thisCart.deliveryFee = 0;
    } else {
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    }

    for (let product of thisCart.products) {
      thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
      thisCart.totalNumber = thisCart.totalNumber + product.amount;
    }

    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    for (let key of thisCart.renderTotalsKeys) {
      for (let elem of thisCart.dom[key]) {
        elem.innerHTML = thisCart[key];
      }
    }
  }

  remove(cartProduct) {
    const thisCart = this;
    thisCart.index = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(thisCart.index, 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();     
  }

  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.order;

    if(thisCart.products.length != 0) {
      const payload = {
        products : [],
        address: thisCart.address,
        phoneNumber: thisCart.phoneNumber,
        subtotalPrice: thisCart.subtotalPrice,
        deliveryFee: thisCart.deliveryFee,
        totalPrice: thisCart.totalPrice,
      };
      for (let product of thisCart.products) {
        payload.products.push(product.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options)
        .then(function(response) {
          return response.json();
        }).then(function(parsedResponse){
          thisCart.clearCart(parsedResponse);
          thisCart.update();
        });
    } else {
      alert('Twój koszyk jest pusty!');
    }
  }

  clearCart(orderedDish) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.dom.productList.remove();
    thisCart.dom.phoneNumber.value = '';
    thisCart.dom.address.value = '';
    thisCart.dom.wrapper.classList.remove(classNames.cart.wrapperActive);
    alert(`Zamówienie o nr ${orderedDish.id} zostało przyjęte do realizacji`);
  }
}

export default Cart;
