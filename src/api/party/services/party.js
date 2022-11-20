'use strict';

/**
 * party service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::party.party', ({ strapi }) => ({
  async getEfficiency(partyId) {
    const promises = await strapi.entityService.findMany('api::promise.promise', { filters: { party: partyId } })
    let total = 0
    let passed = 0
    promises.map((p) => {
      if (p.status === "PASSED") {
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