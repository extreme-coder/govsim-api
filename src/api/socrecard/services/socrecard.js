'use strict';

const country = require('../../country/controllers/country');

/**
 * socrecard service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::socrecard.socrecard', ({ strapi }) => ({
  async addScore(partyId, score, desc) {
    //get the party 
    const party = await strapi.entityService.findOne('api::party.party', partyId, {
      populate: { country: true }
    })

    // create the score card object 
    const socrecard = await strapi.entityService.create('api::socrecard.socrecard', {
      data: {
        party: partyId,
        score: score,
        description: desc,
        publishedAt: new Date(),
        country: party.country.id
      }
    })

    //update the party score
    await strapi.entityService.update('api::party.party', partyId, {
      data: {
        score: parseInt(party.score) + score,
      },
    });

  }
}));
