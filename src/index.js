import express, { response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const app = express()

app.use(express.json())

/**
 * cpf - string
 * name = string
 * id - uuid
 * statment []
 */

// Next verifica se o middleware vai prosseguir
function verifyIfExistsAccountCPF(req, res, next){
   const { cpf } = req.headers
   const customer = customers.find(customer => customer.cpf === cpf)

   if(!customer) {
      return res.status(400).json({ error : "Customer not found" })
   }

   console.log(customer)

   req.customer = customer

   return next();
}

function getBalance(statement) {
   const balance = statement.reduce((acc, operation)=> {
      if(operation.type === 'Credit') {
         return acc + operation.amount
      }else {
         return acc - operation.amount
      }
   }, 0) // Pega as informações e transforma em apenas um valor!
   return balance
}


const customers = [];

app.post("/account", (req, res) => {
   const { cpf, name } = req.body

   const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

   if (customerAlreadyExists) {
      return res.status(400).json({ error: "Customer already exists" })
   }

   customers.push({
      cpf,
      name,
      id: uuidv4(),
      statement: []
   })

   return res.status(201).send()
})

// app.use(verifyIfExistsAccountCPF) Quando quero usar um middleware em mais de uma rota

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
   const { customer } = req

   return res.json(customer.statement)
})

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
   const { amount, description } = req.body
   const { customer } = req

   const statementOperation = {
      description,
      amount,
      createdAt: new Date(),
      type: 'Credit'
   }

   customer.statement.push(statementOperation)

   return res.status(201).send()
})

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
   const { amount } = req.body
   const { customer } = req

   const balance = getBalance(customer.statement)

   if(balance < amount) {
      return response.status(400).json({error: "Insufficient funds!"})
   }

   const statementOperation = {
      amount,
      createdAt: new Date(),
      type: 'Debit'
   }

   customer.statement.push(statementOperation)

   return res.status(201).send()
})


app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
   const { customer } = req
   const { date } = req.query

   const dateFormat = new Date(date + " 00:00")

   const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === 
      dateFormat.toDateString()
   )
   
   console.log(statement)

   return res.json(statement)
})

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
   const { name } = req.body
   const { customer } = req

   customer.name = name

   return res.status(201).send()
})

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
   const { customer } = req

   return res.json(customer)
})

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req
  
  customers.splice(customer, 1)

  return res.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
   const { customer } = req

   const balance = getBalance(customer.statement)

   return res.json(balance)
})

app.listen(3333)

