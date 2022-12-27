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
    strapi.io.to(message.country.id).emit("message", await this.transformResponse(message).data)
    return response
  },
  async messagesRead(ctx) {    
    const {from_party, to_party }= ctx.request.body.data 
    let messages
    if(from_party == -1) {
      messages = await strapi.entityService.findMany('api::message.message', {
        filters: { to_party: to_party, is_group: true, is_read: false },
      })
    } else {
      messages = await strapi.entityService.findMany('api::message.message', {
        filters: { from_party: from_party, to_party: to_party, is_group: false, is_read: false },
      })
    }

    //updateMany doesnt work with relations, so get all Ids to be updated and update at once
    const response = await strapi.db.query('api::message.message').updateMany({
      where: {
        id: messages.map((m) => m.id)
      },
      data: {
        is_read: true,
      },
    });
    return(response)

  }

})) 

