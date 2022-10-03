'use strict';

/**
 * promise router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::promise.promise');