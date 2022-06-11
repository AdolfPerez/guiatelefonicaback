require('dotenv').config()
const express = require(`express`)
const app = express()
const { request } = require("express")
const { response } = require("express")
const cors = require('cors')
const morgan = require('morgan')
const Person = require(`./models/person`)

app.use(express.static('build'))
app.use(express.json())
app.use(
  morgan(
    (tokens, req, res) =>
      [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        JSON.stringify(req.body)
      ].join(' ')
  )
)
app.use(cors())

app.get(
  `/api/persons`,
  (request, response, next) =>
    Person.find({})
      .then(
        persons =>
          persons ?
            response.json(persons) :
            response.status(404).end()
      )
      .catch(
        error => next(error)
      )
)

app.get(
  `/api/persons/:id`,
  ({ params }, response, next) =>
    Person.findById(params.id)
      .then(
        person =>
          person ?
            response.json(person) :
            response.status(404).end()
      )
      .catch(
        error => next(error)
      )
)

app.get(
  `/info`,
  (request, response) =>
    Person.find({})
      .then(
        persons =>
          persons ?
            response.send(
              `<p>Phonebook has info for ${persons.length === 1 ?
                `${persons.length} person` :
                `${persons.length} people`
              }</p><p>${new Date().toString()}</p>`
            ) :
            response.status(404).end()
      )
)

app.delete(
  `/api/persons/:id`,
  ({ params }, response, next) =>
    Person.findByIdAndRemove(params.id)
      .then(
        result => response.status(204).end()
      )
      .catch(
        error => next(error)
      )
)

app.post(
  `/api/persons`,
  ({ body }, response) => {
    if (body.name === undefined) return response.status(400).json({ error: 'name missing' })
    if (body.number === undefined) return response.status(400).json({ error: 'number missing' })
    Person.find({ name: body.name })
      .then(
        result => {
          if (result[0]) {
            return response.status(400).json({ error: 'name must be unique' })
          }
          const person = new Person({
            name: body.name,
            number: body.number,
          })
          person.save()
            .then(
              savedPerson => response.json(savedPerson)
            )
        }
      )
  }
)
app.put(
  `/api/persons/:id`,
  (request, response, next) => {
    const body = request.body
    const person = {
      name: body.name,
      number: body.number,
    }
    Person.findByIdAndUpdate(request.params.id, person, { new: true })
      .then(updatePerson => response.json(updatePerson))
      .catch(error => next(error))
  }
)

const PORT = process.env.PORT
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))

app.use((request, response) => response.status(404).send({ error: 'unknown endpoint' }))

app.use((error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  next(error)
})