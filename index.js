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
        error =>
          next(error)
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
        error =>
          next(error)
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
        result =>
          response.status(204).end()
      )
      .catch(
        error =>
          next(error)
      )
)

app.post(
  `/api/persons`,
  ({ body }, response, next) => {
    const person = new Person({
      name: body.name,
      number: body.number,
    })
    person.save()
      .then(
        savedPerson =>
          response.json(savedPerson.toJSON())
      )
      .catch(
        error =>
          next(error)
      )
  }
)
app.put(
  `/api/persons/:id`,
  (request, response, next) => {
    Person.findByIdAndUpdate(request.params.id, { name: request.body.name, number: request.body.number }, { runValidators: true, new: true })
      .then(
        updatePerson => {
          response.json(updatePerson)
        }
      )
      .catch(
        error => {
          assert.equal(error.errors.name.message, `El nombre debe contener como minimo tres caracteres`)
          assert.equal(error.errors.number.message, `El numero debe contener como minimo ocho digitos`)
          next(error)
        }
      )
  }
)

const PORT = process.env.PORT
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))

app.use((request, response) => response.status(404).send({ error: 'unknown endpoint' }))

app.use((error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
})