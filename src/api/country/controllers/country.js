'use strict';

/**
 * country controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::country.country', ({ strapi }) =>  ({  
  async create(ctx) {
    
    let code = ''    
    let entries = await strapi.entityService.findMany('api::country.country', {        
      filters: { name: ctx.request.body.data.name },        
    });
    if(entries.length >0) {
      return ctx.badRequest('This name is already taken, please try again', {  })
    }    

    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
      entries = await strapi.entityService.findMany('api::country.country', {        
        filters: { join_code: code },        
      });
    } while(entries.length > 0)    
    //as the new country is already in campaign state, the next elections should start after compain period is over
    ctx.request.body.data = {
      ...ctx.request.body.data,
      join_code: code ,      
      status: 'NEW'
    };
    
    const response = await super.create(ctx);    
    //copy data from template 
    const template = await strapi.entityService.findOne('api::country.country', ctx.request.body.data.template)

    //copy data
    strapi.service('api::country.country').copyDataFromTemplate(template.id, response.data.id, 'block')  
    strapi.service('api::country.country').copyDataFromTemplate(template.id, response.data.id, 'country-stat')  
    strapi.service('api::country.country').copyDataFromTemplate(template.id, response.data.id, 'country-law')  
        
    return response;
  },

  async update(ctx) {    
    //when status is changed to STARTED, update first party is_turn to true
    if(ctx.request.body.data.status === 'CAMPAIGN') {
      const parties = await strapi.entityService.findMany('api::party.party', {
        filters: { country: ctx.params.id },
        populate: '*'
      })
      if(parties.length > 0) {
        await strapi.entityService.update('api::party.party', parties[0].id, {
          data: {
            is_turn: true
          }
        })
      }
      //send socket message to all users in the country      
      strapi.io.to(parseInt(ctx.params.id)).emit('country_status_change', {status:'CAMPAIGN'})       
    }
    //update the country based on he request
    const response = await super.update(ctx);
    return response;
  }
  


}));