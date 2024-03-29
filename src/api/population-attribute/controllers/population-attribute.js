'use strict';

/**
 * population-attribute controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::population-attribute.population-attribute', ({ strapi }) =>({
  async getResults(ctx) {
    console.log(ctx.query.election_id)
    const election = ctx.query.election_id
    const demographics = await strapi.entityService.findMany('api::population-attribute.population-attribute')
    const objs = await Promise.all(demographics.map(async (d) => {
      let labels = []
      let data = []
      const blocks = await strapi.entityService.findMany('api::block.block', {
        filters: {demographic: [d.id]}
      });
      let results = []
      await Promise.all(blocks.map(async (b) => {
        results = await strapi.entityService.findMany('api::block-result.block-result', {
          filters: { block: b.id, election: election },
          populate: {party: true}
        });
        await Promise.all(results.map(async (r) => {          
          if (labels.includes(r.party.name)) {
            data[labels.indexOf(r.party.name)] = data[labels.indexOf(r.party.name)] + 1
          } else {
            labels.push(r.party.name)
            data.push(1)
          }
        }))
      }))      
      return {demo: d.name, labels: labels, data: data}
    }))
    return objs.filter((o) => o.labels.length > 0)
  }
}));