const country = require("../src/api/country/controllers/country");

module.exports = {
  '*/1 * * * *': async ({ strapi }) => {
    const countries = await strapi.entityService.findMany('api::country.country', {
      filters: { next_election: new Date() }
    })

    countries.forEach(async (country) => {
      //check if any election is pending 
      const election = strapi.entityService.findMany('api::election.election', {
        filters: { country: country.id }
      })
      if (election.length === 0) {
        const e = await strapi.entityService.create('api::election.election', {
          data: {
            country: country.id,
            publishedAt: new Date()
          },
        })
      }      
    })

    const elections = await strapi.entityService.findMany('api::election.election', {
      filters: {status : 'NEW'},
      populate: '*'
    })
    
    elections.forEach(async (election) => {
      await strapi.service('api::election.election').callElection(election.country.id, election.id)
      await strapi.entityService.update('api::election.election', election.id, {
        data: {status: 'FINISHED'}
      })
    })
    
  },
};