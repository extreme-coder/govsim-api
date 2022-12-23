'use strict';

/**
 * pict-card controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pict-card.pict-card', ({ strapi }) =>  ({  
  async getRandomCard(ctx) {            
    console.log(ctx.query.category)

    //get a random card based on the category 
    const cards = await strapi.entityService.findMany('api::pict-card.pict-card', {
      filters: {
        pict_category: ctx.query.category,
        is_used: false
      },
      populate: '*'
    })
    console.log(cards)

    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    //upate the card to be used
    await strapi.entityService.update('api::pict-card.pict-card', randomCard.id, {
      data: {
        is_used: true,
      },
    });

    return randomCard;
  }
}));