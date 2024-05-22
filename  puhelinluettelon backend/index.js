require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
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

// Routes
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

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
        if (person) {
            response.json(person)
        } else {
            response.status(404).end()
        }
    }).catch(error => next(error))
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
        }).catch(error => response.status(500).json({ error: 'Database error' }))
    })
})

app.put('/api/persons/:id', (request, response, next) => {

    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'Name or Number missing' })
    }

    const person = {
        name: body.name,
        number: body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
        .then(updatedPerson => {
            if (updatedPerson) {
                response.json(updatedPerson)
            } else {
                response.status(404).end()
            }
        }).catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Person.findByIdAndDelete(id).then(deletedPerson => {
        if (deletedPerson) {
            response.status(204).end()
        } else {
            response.status(404).end()
        }
    }).catch(error => next(error))
})

// Unknown Endpoint Middleware
const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

// Error Handler Middlware
const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
