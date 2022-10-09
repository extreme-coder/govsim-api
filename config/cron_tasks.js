module.exports = {
    '*/1 * * * *': async ({ strapi }) => {
        const countries = (await strapi.service('api::country.country').find())['results']
        countries.map(async (c) => {
            const e = await strapi.entityService.create('api::election.election', {
                data: {
                    country: c.id,
                    publishedAt: new Date()
                },
            })
            console.log(e)
            await strapi.service('api::election.election').callElection(c.id, e.id)
        })
    },
};