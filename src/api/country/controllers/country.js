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

    ctx.request.body.data = {
      ...ctx.request.body.data,
      join_code: code ,      
      next_election: Date.now() + (ctx.request.body.data.election_period * 60000)
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

  
}));