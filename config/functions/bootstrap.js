'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */


module.exports = () => {
  var io = require('socket.io')(strapi.server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  io.sockets.on('connection', function(socket) {
    socket.on('joinGame', function(room) {
      socket.join(room);
      console.log('socket joined country ' + room)
    });
  });
  strapi.io = io;
}
