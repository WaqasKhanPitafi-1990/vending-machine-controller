const dotenv = require('dotenv').config();

class Utility {
    constructor() {
      const instance = this;

      this.CLOUD_URL = process.env.CLOUD_URL;
      this.CANTEEN_ID = process.env.CANTEEN_ID;
      this.CANTEEN_URL = process.env.CANTEEN_URL;
      instance.updateCanteenIdEndPoint(instance);
      //call the function every 5 minutes.
      setInterval(function(){ instance.updateCanteenIdEndPoint(instance);},300000);

    }

    /**
     * Update the endpoint of the industrial pc against the 
     * canteen in the web cloud.
     * @param {*} instance 
     */
    updateCanteenIdEndPoint (instance) {
      const headers = {};
      const data = {
        canteen_id: instance.CANTEEN_ID,
        end_point: instance.CANTEEN_URL 
      };
      axios.post(`${instance.CLOUD_URL}/canteen/canteen_id`, data, {headers}).then(response => {}).catch(error => {});
    }

    /**
     * This API will call the cloud server to update the 
     * delivery status of the product
     */
    updateProductDeliveryStatus (orderId, productId, deliveryStatus, webHook) {
      const headers = {};
      const data = {
        orderId,
        productId,
        deliveryStatus
      };
      axios.post(`${webhook}/update-product-delivery-status`, data, {headers}).then(response => {}).catch(error => {});
    }

}

module.exports = Utility;