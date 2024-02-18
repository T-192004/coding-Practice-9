const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()

const dbPath = path.join(__dirname, 'userData.db')
app.use(express.json())

let db = null
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

//API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  console.log(request.body)
  const hashedPassword = await bcrypt.hash(password, 10)
  let checkTheUserName = `
    SELECT 
        * 
    FROM
        user
    WHERE username = '${username}';`
  const userData = await db.get(checkTheUserName)
  console.log(userData)
  if (userData !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const postNewQuery = `
        INSERT INTO 
            user(username, name, password, gender, location)
        VALUES ('${username}', 
                '${name}', 
                '${hashedPassword}',
                '${gender}',
                '${location}'
                );
        `
      await db.run(postNewQuery)
      response.status(200)
      response.send('User created successfully')
    }
  }
})
//API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  console.log(request.body)
  const loginUserRequestQuery = ` 
  SELECT 
    * 
  FROM 
    user
  WHERE username = '${username}';
  `
  const dbUser = await db.get(loginUserRequestQuery)
  console.log(dbUser)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  console.log(request.body)
  const checkUserPasswordQuery = `
  SELECT 
    *
  FROM 
    user
  WHERE
    username = '${username}';
  `
  const dbUser = await db.get(checkUserPasswordQuery)
  console.log(dbUser)
  const isOldPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbUser.password,
  )
  console.log(isOldPasswordMatched)
  if (isOldPasswordMatched) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 10)
      const updatePasswordUserQuery = ` 
      UPDATE 
        user
      SET
        password = '${newHashedPassword}'
      WHERE
        username = '${dbUser.username}';
      `
      await db.run(updatePasswordUserQuery)
      response.status(200)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
