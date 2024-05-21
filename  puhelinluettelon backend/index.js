require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const Person = require('./models/person')

const app = express()
const date = new Date()

// Middlware
app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(morgan('tiny'))

morgan.token('body', (request) => JSON.stringify(request.body))
app.use(morgan(':method :url :status : response-time ms - :res[content-length] :body'))

app.get('/', (request, response) => {
    response.send('<h1>Puhelinluettelo Backend!</h1>')
})

app.get('/info', (request, response) => {
    Person.countDocuments({}).then(count => {
        response.send(`<p>Phonebook have entry for ${count} people <br/> ${date}</p>`)
    })
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response) => {
    Person.findById(request.params.id).then(person => {
        if (person) {
            response.json(person)
        } else {
            response.status(404).end()
        }
    })
})

app.post('/api/persons', (request, response) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'Name or Number missing'
        })
    }

    // using the built in findOne to return true or false
    Person.findOne({ name: body.name }).then(nameExist => {
        if (nameExist) {
            return response.status(400).json({
                error: 'name must be unique'
            })
        }
        const person = new Person({
            name: body.name,
            number: body.number,
        })

        person.save().then(savedPerson => {
            response.json(savedPerson)
        })
    })
})

app.delete('/api/persons/:id', (request, response) => {
    const id = request.params.id
    Person.findByIdAndDelete(id).then(deletedPerson => {
        if (deletedPerson) {
            response.status(204).end()
        } else {
            response.status(404).end()
        }
    }).catch(error => {
        console.error(error)
        response.status(400).send({ error: 'malformatted id' })
    })
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
