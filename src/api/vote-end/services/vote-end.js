'use strict';

/**
 * vote-end service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vote-end.vote-end');