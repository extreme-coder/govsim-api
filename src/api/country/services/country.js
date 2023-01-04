'use strict';

/**
 * country service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::country.country', ({ strapi }) => ({
  async copyDataFromTemplate(templateId, countryId, entityName) {
    const entries = await strapi.entityService.findMany(`api::${entityName}.${entityName}`, {        
        filters: { country: templateId },      
        populate: '*'  
      });
      entries.forEach(async (entry) => {
        if(entityName === 'block') {
          entry.parent_block = entry.id
        }
        entry.country = countryId
        entry.id = undefined
        entry.createdBy = undefined
        entry.updatedBy = undefined        
        await strapi.entityService.create(`api::${entityName}.${entityName}`, {
          data: entry
        })
      });
  },

  async updateAllParties(countryId, data) {    
    const parties = await strapi.entityService.findMany('api::party.party', {
      filters: { country: countryId },
    })
    await strapi.db.query('api::party.party').updateMany({
      where: {
        id: parties.map((c) => c.id)
      },
      data: data,
    });
  },

}));