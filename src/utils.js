const axios = require("axios")
const { decode } = require("js-base64")
const { outdent } = require("outdent")

const fixedMessages = {
  help: outdent`
    The Bedav bot is here to help you find a hospital with available beds
    You can use the following commands:
    1. *help* - Get this menu and all the commands you can use
    2. *cities* - Get a list of all the cities available
    2. *search* _<hospital-name>_ *in* _<location>_ - Search for a hospital in a particual location. For example, "search for sakra in bangalore" searches for hospitals with the name sakra in bangalore
    3. *get directions to* _<hospital-id>_ - Get directions to a hospital with a particular ID. You can get the hospital ID from the search results. The serial number preceding the Hospital name is the Hospital ID. For example if the search result has _(87) Sakra Hospital_, send _get directions to 87_ to get directions to Sakra Hospital.
  `,
  cities: outdent`
    The cities/districts currently available are:

    *Karnataka*
      1. Bangalore/Bengaluru

    *Maharashtra*
      2. Pune
      3. Kohlapur
      4. Sangli
      5. Satara
      6. Solapur

    *Andhra Pradhesh*
      7. Anantapur
      8. Chittoor
      9. East Godavari
      10. Guntur
      11. Krishna
      12. Kurnool
      13. Prakasam
      14. Nellore
      15. Srikakulam
      16. Vishakapatanam
      17. Vizianagaram
      18. West Godavari
      19. Kadapa
  `,
}

const cityKey = {
  bangalore: "bengaluru-karnataka",
  bengaluru: "bengaluru-karnataka",

  // MH
  pune: "pune-maharashtra",
  kohlapur: "kohlapur-maharashtra",
  sangli: "sangli-maharashtra",
  satara: "satara-maharashtra",
  solapur: "solapur-maharashtra",

  // AP
  anatapur: "anatapur-andhra pradesh",
  chittoor: "chittoor-andhra pradesh",
  "east godavari": "east godavari-andhra pradesh",
  guntur: "guntur-andhra pradesh",
  krishna: "krishna-andhra pradesh",
  kurnool: "kurnool-andhra pradesh",
  prakasam: "prakasam-andhra pradesh",
  nellore: "spsr nellore-andhra pradesh",
  srikakulam: "srikakulam-andhra pradesh",
  vishakapatanam: "vishakapatanam-andhra pradesh",
  vizianagaram: "vizianagaram-andhra pradesh",
  "west godavari": "west godavari-andhra pradesh",
  kadapa: "kadapa-andhra pradesh",
}

const removeEmptyLines = (string) => {
  const lines = string.split("\n")
  const newLines = []

  for (const line of lines) {
    if (line.match(/^\s*$/)) continue
    newLines.push(line)
  }

  return newLines.join("\n")
}

const getHospitalId = (encodedId) => {
  return decode(encodedId).slice(9)
}

const sendMessage = async (to, message, type = "text") => {
  let from = { type: to.type }

  if (to.type === "whatsapp") {
    from.number = process.env.WHATSAPP_NUMBER
  } else if (to.type === "messenger") {
    from.id = process.env.MESSENGER_ID
  }

  await axios.post(
    "https://messages-sandbox.nexmo.com/v0.1/messages",
    {
      from,
      to,
      message: {
        content: {
          type: type,
          [type]: message,
        },
      },
    },
    {
      auth: {
        username: process.env.VONAGE_API_KEY,
        password: process.env.VONAGE_API_SECRET,
      },
    }
  )
}

const getFormattedHospital = (hospital) => {
  const index = getHospitalId(hospital.id)

  const roundedString = (occupied, total) => {
    return `${Math.floor((occupied * 100) / total)}% Occupied`
  }

  const h = hospital

  const percentages = {
    icu: roundedString(hospital.icuOccupied, hospital.icuTotal),
    hdu: roundedString(hospital.hduOccupied, hospital.icuTotal),
    oxygen: roundedString(hospital.oxygenOccupied, hospital.icuTotal),
    general: roundedString(hospital.generalOccupied, hospital.icuTotal),
    ventilators: roundedString(hospital.ventilatorsOccupied, hospital.icuTotal),
  }

  const formatted = outdent`
    *(${index}) ${hospital.name}*
      ${h.icuTotal !== 0 && h.icuAvailable !== null ? `_ICU Available_: ${h.icuAvailable} (${percentages.icu})` : ""}
      ${h.hduTotal !== 0 && h.icuAvailable !== null ? `_HDU Avalable_: ${h.hduAvailable} (${percentages.hdu})` : ""}
      ${h.oxygenTotal !== 0 && h.oxygenAvailable !== null ? `_Oxygen Available_: ${h.oxygenAvailable} (${percentages.oxygen}})` : ""}
      ${!h.generalTotal !== 0 && h.generalAvailable !== null ? `_General Available_: ${h.generalAvailable} (${percentages.general})` : ""}
      ${
        !h.ventilatorsTotal !== 0 && h.ventilatorsAvailable !== null
          ? `_Ventilators Available_: ${h.ventilatorsAvailable} (${percentages.ventilators})`
          : ""
      }
      ${h.phone !== null ? `_Phone_: ${h.phone}` : ""}
      ${h.website !== null ? `_Website_: ${h.website}` : ""}
  `

  return removeEmptyLines(formatted)
}

const getFormattedHospitals = (hospitals) => {
  let message = ""

  for (const hospital of hospitals) {
    const formattedHospital = getFormattedHospital(hospital)
    message += formattedHospital + "\n\n"
  }

  return message
}

module.exports = {
  fixedMessages,
  cityKey,
  sendMessage,
  getFormattedHospitals,
}
