const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('Please provide the password as an argument: node mongo.js <password>')
  process.exit(1)
}

mongoose.connect(`mongodb+srv://Adolfo:${process.argv[2]}@cluster0.8ym4v.mongodb.net/agenda-app?retryWrites=true&w=majority`)

const Person = mongoose.model('Person', new mongoose.Schema({ name: String, number: String }))

const person = new Person({ name: process.argv[3], number: process.argv[4] })

process.argv.length < 4 ?

  (
    console.log(`phonebook:`),
    Person.find({}).then(result => {
      result.forEach(person => {
        console.log(person.name, person.number)
      })
      mongoose.connection.close()
    })
  ) :

  person.save().then(result => {
    console.log(`added ${process.argv[3]} number ${process.argv[4]} to phonebook`)
    mongoose.connection.close()
  })