const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

const PORT = process.env.PORT || 3000
// client cli test - curl -H Accept:text/event-stream http://localhost:3000/events

let clients = []
let facts = []

app.get('/status', (request, response) => {
    response.json({clients: clients.length})
})


function eventHandler(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    }
    response.writeHead(200, headers)
    const data = `data: ${JSON.stringify(facts)}\n\n`;
    response.write(data)

    const clientId = Date.now()
    const newClient = {
        id: clientId,
        response
      };
      clients.push(newClient);

      request.on('close', () => {
          console.log(`${clientId} connection closed`)
          clients = clients.filter((client) => client.id !== clientId)
      })

}

app.get('/events', eventHandler);


function sendEventsToAll(newFact) {
    clients.forEach((client) => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
}

async function addFact(request, response, next) {
    const newFact = request.body;
    facts.push(newFact);
    response.json(newFact)
    return sendEventsToAll(newFact);
}

function runPeriodic() {
    counter = 0
    setInterval(()=> {
        counter++
        counter = counter % quotes.length
        msg = {data: quotes[counter]}
        sendEventsToAll(msg);
    }, 10000)
}

app.post('/fact', addFact)

runPeriodic()
function readCSV() {
    let quotes = []
    try {
        const data = fs.readFileSync('data/quotes_min.csv', 'utf-8');
        lines = data.split("\n")
        console.log(lines.length)
        quotes = lines.map((line) => line.split(',')[0])
        return quotes
    } catch(e) {
        console.error(e)
        return
    } 
}
quotes = readCSV()
app.listen(PORT, ()=> {
    console.log("event service is listening on port", PORT)
})