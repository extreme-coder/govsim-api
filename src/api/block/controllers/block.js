'use strict';

/**
 * block controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::block.block', ({ strapi }) =>  ({  
  async blocksGroup(ctx) {            
    let blocks = await strapi.entityService.findMany('api::block.block', {        
      filters: { country: ctx.query.country },  
      populate: {demographic: true}     
    });
    let data = {}
    
    blocks.forEach((block) => {
      const demoName = block.demographic.name
      if(data[demoName]) {
        data[demoName]++
      } else {
        data[demoName] = 1
      }      
    })
    return Object.keys(data).map((k) => ({x: k, y: (data[k]*100)/blocks.length}))
  }
}));