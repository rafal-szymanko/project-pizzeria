import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
  initPages: function() {
    const thisApp = this;
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    const navLinks = document.querySelectorAll(select.nav.links);
    const mainPageNav = document.querySelectorAll(select.nav.mainPageNav);

    thisApp.navLinks =[...navLinks,...mainPageNav];

    const idFromHash = window.location.hash.slice(2);

    let pageMatchingHash = thisApp.pages[0].id;
    for(let page of thisApp.pages){
      if(page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }
    // 
    thisApp.activatePage(pageMatchingHash);

    const cart = document.getElementById('cart');
    const mainNavWrapper = document.querySelector('.main-nav');

    if(pageMatchingHash == 'main-page'){
      cart.style.display = 'none';
      mainNavWrapper.style.display = 'none';
      
    }

    for(let link of thisApp.navLinks) {
      link.addEventListener('click', function(event){
        event.preventDefault();
        const id = link.getAttribute('href').slice(1);
        thisApp.activatePage(id);
        window.location.hash = `#/${id}`;
        cart.style.display = 'block';
        mainNavWrapper.style.display = 'flex';
      });
    }
    
    const elem = document.querySelector('.main-carousel');
    
    // eslint-disable-next-line no-undef
    new Flickity( elem, {
      autoPlay: true
    });

  },

  activatePage: function(pageID) {
    const thisApp = this;
    for (let page of thisApp.pages){
      page.classList.toggle(
        classNames.pages.active, 
        page.id == pageID);
    }
    for (let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.pages.active, 
        link.getAttribute('href').slice(1) == pageID);
    } 
  },
  initBooking: function() {
    const thisApp = this;
    const bookingWidgetWrapper = document.querySelector(select.containerOf.booking);
    thisApp.bookingWidget = new Booking(bookingWidgetWrapper);
  },
  initMenu: function() {
    const thisApp = this;
    for(let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initData: function() {
    const thisApp = this;
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.product;
    fetch(url)
      .then(function(rawResponse) {
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
  },
  initCart: function(){
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);    
    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },
  init: function(){
    const thisApp = this;
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
  },
};
app.init();


