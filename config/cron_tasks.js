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
          next_election: new Date(new Date().getTime() + election.country.election_period * 60000)
        }
      })
      //update next campaign date by election period - campaign_period minutes
      await strapi.entityService.update('api::country.country', election.country.id, {
        data: {
          next_campaign: new Date(new Date().getTime() + (election.country.election_period - election.country.campaign_period) * 60000)
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
          finished_campaign: false, ready_for_election: false
        },
      });

      await strapi.entityService.update('api::election.election', election.id, {
        data: { status: 'FINISHED' }
      })
      strapi.io.to(election.country.id).emit('election_finished', {})
    })


    //fetch all countries which are in status Parliament or Campaign
    const countries = await strapi.entityService.findMany('api::country.country', {
      filters: { status: ['PARLIAMENT', 'CAMPAIGN'] },
    });

    countries.forEach(async (country) => {
      console.log('country', country)      

      //check if next_campaign is in the past
      if (country.status === 'PARLIAMENT' && new Date(country.next_campaign).getTime() < new Date().getTime()) {
        //change country status to campaign
        await strapi.entityService.update('api::country.country', country.id, {
          data: {
            status: 'CAMPAIGN'
          }
        })        
        //change all parties finished_campaign to false
        const parties = await strapi.entityService.findMany('api::party.party', {
          filters: { country: country.id },
        })
        await strapi.db.query('api::party.party').updateMany({
          where: {
            id: parties.map((c) => c.id)
          },
          data: {
            finished_campaign: false, ready_for_election: false
          },
        });

        //send socket message for campaign started
        strapi.io.to(country.id).emit('campaign_started', {})
      }      
      else if (country.status === 'CAMPAIGN' && new Date(country.next_election).getTime() < new Date().getTime()) {
        console.log("time to call election")
        //check if any election is pending 
        const elections = await strapi.entityService.findMany('api::election.election', {
          filters: { country: country.id, status: 'NEW' }
        })
        console.log(elections)
        if (elections.length === 0) {
          const e = await strapi.entityService.create('api::election.election', {
            data: {
              country: country.id,
              publishedAt: new Date()
            },
          })
          await strapi.entityService.update('api::country.country', country.id, {
            data: {
              elections_occurred: true, status: 'ELECTIONS'
            }
          })
          strapi.io.to(party.country.id).emit('election_underway', {})
        }
      }
    })

  },
};