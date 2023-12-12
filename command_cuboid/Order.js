class Order {
    constructor() {
      this.orderId = 0;
      /**
       * products
       * {
       *  productId: number,
       *  tokenNumber: string,
       *  deliveryStatus: string 
       * //queued, received, in process, delivered, failed, product ready to be collected
       * }
       */
      this.products = [];
      this.webHook = "";
      this.utility = null;
    }
    
    setOrderId(orderId) {
      this.orderId = orderId;
    }

    getOrderId() {
      return this.orderId;
    }

    addProduct(product) {
      this.products.push({
        productId: product.productId,
        tokenNumber: product.tokenNumber,
        deliveryStatus: 'received'
      })
    }

    updateProductDeliveryStatus(tokenNumber, status) {
      let deliveryStatus = 'queued';
      if(status === 0) {
        deliveryStatus = 'received';
      } else if(status === 1) {
        deliveryStatus = 'in process';
      } else if(status === 2) {
        deliveryStatus = 'product ready to be collected';
      } else if(status === 3) {
        deliveryStatus = 'delivered';
      }  else if(status === 4) {
        deliveryStatus = 'failed';
      }  else if(status === 5) {
        deliveryStatus = 'failed';
      } else {
        deliveryStatus = 'queued';
      } 

      this.products.forEach((p, i) =>  { 
        if(p.tokenNumber === tokenNumber) { 
          this.products[i].deliveryStatus = deliveryStatus;
          //call the web hook to update the product status
          this.utility.updateProductDeliveryStatus(this.orderId, this.products[i].productId, deliveryStatus, this.webHook);
        }          
      }); 
    }

    getProducts() {
      return this.products;
    }

    setWebHook(webHook) {
      this.webHook = webHook;
    }

    getWebHook() {
      return this.webHook;
    }

    setUtility(utility) {
      this.utility = utility;
    }

    getUtility() {
      return this.utility;
    }

  }

  module.exports = Order;