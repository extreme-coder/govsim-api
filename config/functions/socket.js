const { strapi } = require('strapi');

module.exports = (strapi) => {
    return require('socket.io')(strapi.server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    })
}