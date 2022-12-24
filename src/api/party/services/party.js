'use strict';

/**
 * party service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::party.party', ({ strapi }) => ({
  async getEfficiency(partyId) {
    const promises = await strapi.entityService.findMany('api::promise.promise', { filters: { party: partyId }, populate: { country_law: true, law: true } })
    let total = 0
    let passed = 0
    promises.map(async (p) => {
      const c = await strapi.entityService.findOne('api::country-law.country-law', p.country_law.id, { populate: { passed_law: true } })
      if (c.passed_law.id === p.law.id) {
        passed++
      }
      if (p.status !== "NEW") {
        total++
      }
    })
    if (total === 0) {
      return 1
    }
    return parseFloat(passed)/parseFloat(total)
  },
  async joinParliament(partyId) {
    console.log("service called")
    const promises = await strapi.entityService.findMany('api::promise.promise', { filters: { party: partyId } })
    promises.map(async (p) => {
      console.log(`status is ${p.status}`)
      if (p.status === "NEW") {
        await strapi.entityService.update('api::promise.promise', p.id, { data: { status: "PROPOSED" } })
      }
    })
  },

}));