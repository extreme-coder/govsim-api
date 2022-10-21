"use strict";
    module.exports = {
      /**
       * An asynchronous register function that runs before
       * your application is initialized.
       *
       * This gives you an opportunity to extend code.
       */
      register({ strapi }) {},
      /**
       * An asynchronous bootstrap function that runs before
       * your application gets started.
       *
       * This gives you an opportunity to set up your data model,
       * run jobs, or perform some special logic.
       */
      bootstrap( { strapi } ) {
        //strapi.server.httpServer is the new update for Strapi V4
        var io = require("socket.io")(strapi.server.httpServer, {
          cors: { // cors setup
            origin: ProcessingInstruction.env.UI_DOMAIN,
            methods: ["GET", "POST"],
            allowedHeaders: ["my-custom-header"],
            credentials: true,
          },
        });
        strapi.io = io
        io.on("connection", function (socket) { //Listening for a connection from the frontend
          socket.on("join", ({ username }) => { // Listening for a join connection
            
          });
          
        });
      },
    };