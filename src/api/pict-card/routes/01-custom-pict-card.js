module.exports = {
  routes: [ 
    { // Path defined with a regular expression
      method: 'GET',
      path: '/cards/random', // Only match when the URL parameter is composed of lowercase letters
      handler: 'pict-card.getRandomCard',
    }
  ]
}