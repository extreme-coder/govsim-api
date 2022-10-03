'use strict';

/**
 * crisis-vote service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::crisis-vote.crisis-vote');