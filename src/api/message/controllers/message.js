'use strict';

/**
 * message controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::message.message', ({ strapi }) =>  ({  
  async create(ctx) {
    const response = await super.create(ctx);    
    const message = await strapi.entityService.findOne('api::message.message', response.data.id, {
      populate: '*'
    })
    strapi.io.emit("message", await this.transformResponse(message).data)
    return response
  }
})) 

