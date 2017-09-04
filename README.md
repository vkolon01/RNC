<h1>Roman Numeral Converter </h1>

RNC is a CRUD api that runs on a local server. RNC allows the user to convert values between roman and arabic numerals by using routes.


**Installation:**

1. Install <a href="https://www.nodejs.org">Node.js</a>. Node.js will also install npm.

2. Install <a href="https://www.mongodb.com">MongoDB</a>.

3. In the command line install all the dependencies with 'npm install'

**Running and testing**

1. Launch  mongodb on localhost:27017

2. Cmd commands:
   -Run the server: npm start
   -Run the tests: npm test

**Interface**
Routes:
<ul>
    <li>**GET /roman/:number** Returns the arabic numeral input value and converted roman value</li>
    <li>**GET /arabic/:number** Returns the roman numeral input value and converted arabic value</li>
    <li>**GET /all/:numeralType** Returns all the previously converted values in a requested by the parameter numeral type</li>
    <li>**DELETE /remove/all** Deletes the entire converted values collection on the database and returns status code 200 on success</li>
</ul>