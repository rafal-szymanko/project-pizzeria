import {settings, templates, select, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }
  renderInMenu() {
    const thisProduct = this;
    const generatedHTML = templates.menuProduct(thisProduct.data);
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
    menuContainer.appendChild(thisProduct.element);
  }
  getElements(){
    const thisProduct = this; 
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    thisProduct.amountWidgetInput = thisProduct.element.querySelector('.widget-amount input');
  }
    
  initAccordion(){
    const thisProduct = this;
    /* find the clickable trigger (the element that should react to clicking) */
    // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    /* START: click event listener to trigger */

    thisProduct.accordionTrigger.addEventListener('click', function(event) {

      /* [DONE] prevent default action for event */
      event.preventDefault();

      /* [DONE] toggle active class on element of thisProduct */
      thisProduct.element.classList.toggle('active');
      /* [DONE] find all active products */
      const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
      /* [DONE] START LOOP: for each active product */
      for (let activeProduct of activeProducts) {
        /* [DONE] START: if the active product isn't the element of thisProduct */
        if (activeProduct != thisProduct.element ) {
          /* [DONE] remove class active for the active product */
          activeProduct.classList.remove('active');
        }
        /* END: if the active product isn't the element of thisProduct */

      }
      /* END LOOP: for each active product */
    });
    /* END: click event listener to trigger */
  }

  initOrderForm() {
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
      thisProduct.amountWidget.value = settings.amountWidget.defaultValue;
    });
  }
    
  processOrder() {
    const thisProduct = this;
    thisProduct.params = {};
    let price = thisProduct.data.price;
    const formData = utils.serializeFormToObject(thisProduct.form);
    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      for (let optionId in param.options){
        const option = param.options[optionId];
        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
        if (optionSelected && !option.default) {
          price = price + option.price;
        } else if (!optionSelected && option.default){
          price = price - option.price;
        }
        const productsImages = thisProduct.imageWrapper.querySelectorAll(`.${paramId}-${optionId}`);
        if  (optionSelected){
          if(!thisProduct.params[paramId]){
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label;
          for (let images of productsImages){
            images.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          for (let images of productsImages){
            images.classList.remove(classNames.menuProduct.imageVisible);
          }
        }

      }
    }
    /* multiply price by amount */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem.innerHTML = thisProduct.price;
      
  }

  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;
    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct
      }
    });
    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;