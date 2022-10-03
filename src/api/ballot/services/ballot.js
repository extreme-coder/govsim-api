'use strict';

/**
 * ballot service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::ballot.ballot');