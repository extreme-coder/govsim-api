const country = require("../src/api/country/controllers/country");

module.exports = {
  '*/1 * * * *': async ({ strapi }) => {
    

    const elections = await strapi.entityService.findMany('api::election.election', {
      filters: { status: 'NEW' },
      populate: '*'
    })

    elections.forEach(async (election) => {
      await strapi.service('api::election.election').callElection(election.country.id, election.id)
    
      
      await strapi.entityService.update('api::country.country', election.country.id, {
        data: {
          next_parliament_session: new Date(new Date().getTime() + election.country.coalition_period * 60000)
        }
      })     
    
      const parties = await strapi.entityService.findMany('api::party.party', {
        filters: { country: election.country.id },
      })
      await strapi.db.query('api::party.party').updateMany({
        where: {
          id: parties.map((c) => c.id)
        },
        data: {
          finished_campaign: false, ready_for_election: false, ready_for_parliament:false
        },
      });

      await strapi.entityService.update('api::election.election', election.id, {
        data: { status: 'FINISHED' }
      })
      strapi.io.to(election.country.id).emit('election_finished', {})
    })


    //fetch all countries which are in status Colations
    const countries = await strapi.entityService.findMany('api::country.country', {
      filters: { status: ['COALITIONS'] },
    });

    countries.forEach(async (country) => {            
      if (country.status === 'COALITIONS' && new Date(country.next_parliament_session).getTime() < new Date().getTime()) {        
        await strapi.entityService.update('api::country.country', country.id, {
          data: {
            elections_occurred: true, status: 'PARLIAMENT'
          }
        })    
        strapi.io.to(country.id).emit('country_status_change', {status:'PARLIAMENT'})              
      }
    })

  },
};