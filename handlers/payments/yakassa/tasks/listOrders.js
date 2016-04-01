'use strict';

const co = require('co');
const mws = require('../lib/mws');
const yakassaConfig = require('config').payments.modules.yakassa;
const parseString = require('xml2js').parseString;

/**
 * Mark TX as paid
 * @returns {Function}
 */
module.exports = function() {

  return function() {

    return co(function*() {


      var args = require('yargs')
        .example("gulp payments:yakassa:listOrders --from 2016-01-01 --to 2016-01-31")
        .demand(['from', 'to'])
        .argv;

      let date = new Date();

      let dateFrom = new Date(args.from);
      let dateTo = new Date(args.to);
      dateTo.setDate(dateTo.getDate() + 1);
      dateTo = new Date(dateTo.getTime() - 1);

      let params = {
        requestDT:                          date.toJSON(),
        outputFormat:                       'XML',
        shopId:                             yakassaConfig.shopId,
        orderCreatedDatetimeLessOrEqual:    dateTo.toJSON(),
        orderCreatedDatetimeGreaterOrEqual: dateFrom.toJSON()
      };

      let result = yield* mws.sendFormRequest('listOrders', params);

      let resultObj = yield function(callback) {
        parseString(result, callback);
      };

      let orders = resultObj.listOrdersResponse.order;

      orders = orders.map(order => order.$);
      console.log(orders);

      let sum = 0;
      for (let i = 0; i < orders.length; i++) {
        let order = orders[i];
        if (order.paid != 'true') {
          console.error(order);
          throw new Error("Order not paid?");
        }
        sum += + +order.orderSumAmount;
      }

      console.log("Sum ", sum);
      // console.log(require('util').inspect(orders, false, null));

    });

  };
};

