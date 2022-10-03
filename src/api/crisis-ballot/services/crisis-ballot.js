'use strict';

/**
 * crisis-ballot service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::crisis-ballot.crisis-ballot');