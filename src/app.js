const express = require("express")
const bodyParser = require("body-parser")
const { GraphQLClient } = require("graphql-request")
const { sendMessage, getFormattedHospitals, fixedMessages, cityKey } = require("./utils")
const { directionsGraphQLQuery, searchGraphQLQuery } = require("./queries")
const { encode } = require("js-base64")
require("dotenv").config()

const client = new GraphQLClient("https://bedav.org/graphql")

const handleSearch = async (message, to) => {
  let remaining = message.split("search")[1].trim()

  const split = remaining.split("in")
  const city = split[split.length - 1].trim()
  const searchQuery = split
    .slice(0, split.length - 1)
    .join("in")
    .trim()

  if (!Object.keys(cityKey).includes(city)) {
    sendMessage(to, "Invalid location entered. Type *cities* to look at all the cities available")
    return
  }

  try {
    const data = await client.request(searchGraphQLQuery, { location: cityKey[city], query: searchQuery })
    const { edges } = data.locality.hospitals
    const hospitals = edges.map((item) => item.node)
    const formatedMessage = getFormattedHospitals(hospitals)
    sendMessage(to, formatedMessage)
  } catch (error) {
    sendMessage(to, "Sorry, there were no hospitals that matched your search 🙁")
  }
}

const handleDirections = async (message, to) => {
  let remaining = message.split("get directions to")[1].trim()
  let hospitalId

  try {
    hospitalId = parseInt(remaining)
  } catch (error) {
    sendMessage(to, "Please enter a valid Hospital ID")
  }

  hospitalId = encode(`Hospital:${hospitalId}`)

  try {
    const { hospital } = await client.request(directionsGraphQLQuery, { id: hospitalId })

    if (to.type === "whatsapp") {
      sendMessage(
        to,
        {
          type: "location",
          location: {
            longitude: hospital.longitude,
            latitude: hospital.latitude,
            name: hospital.name,
            address: hospital.address,
          },
        },
        "custom"
      )
    } else {
      const link = `https://maps.google.com/maps?q=${hospital.latitude},${hospital.longitude}`
      const message = `${link}\n*${hospital.name}*\n${hospital.address}\n`

      // send a regular text message if the user is using messenger
      sendMessage(to, message)
    }
  } catch (error) {
    sendMessage(to, "Please enter a valid Hospital ID")
  }
}

const handleInbound = async (request, response) => {
  const content = request.body.message.content
  const text = content.text.toLowerCase().trim()
  const to = request.body.from

  if (text.startsWith("search") && text.includes("in")) {
    handleSearch(text, to)
  } else if (text.startsWith("get directions to")) {
    handleDirections(text, to)
  } else if (["help", "hi", "hey", "hello"].includes(text)) {
    sendMessage(to, fixedMessages.help)
  } else if (text === "cities") {
    sendMessage(to, fixedMessages.cities)
  } else {
    sendMessage(to, `Sorry, invalid message. Please try again\n${fixedMessages.help}`)
  }

  response.status(200).end()
}

const handleStatus = (request, response) => {
  response.status(200).end()
}

const app = express()

app.use(express.json())

app.post("/webhooks/inbound", handleInbound)
app.post("/webhooks/status", handleStatus)
app.listen(3000, () => {
  console.log("Listening on port 3000")
})
