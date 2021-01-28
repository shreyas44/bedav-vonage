const { gql } = require("graphql-request")

const searchGraphQLQuery = gql`
  query($location: String, $query: String) {
    locality(name: $location) {
      hospitals(first: 10, searchQuery: $query) {
        edges {
          node {
            id
            name
            phone
            website
            address
            latitude
            longitude

            icuAvailable
            hduAvailable
            oxygenAvailable
            generalAvailable
            ventilatorsAvailable

            icuOccupied
            hduOccupied
            oxygenOccupied
            generalOccupied
            ventilatorsOccupied

            icuTotal
            hduTotal
            oxygenTotal
            generalTotal
            ventilatorsTotal
          }
        }
      }
    }
  }
`

const directionsGraphQLQuery = gql`
  query($id: ID!) {
    hospital(id: $id) {
      id
      longitude
      latitude
      name
      address
    }
  }
`

module.exports = {
  searchGraphQLQuery,
  directionsGraphQLQuery,
}
