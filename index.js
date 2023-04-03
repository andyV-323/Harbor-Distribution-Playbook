const express      = require("express");
const app          = express();
const mysql        = require('mysql');
const bodyParser   = require('body-parser');
const http         = require('http');
const fs           = require('fs');
const path         = require('path');
const cookieParser = require('cookie-parser');


// Set up middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function(req, res) {
    //always include __dirname to get directory 
    res.sendFile(__dirname + "/index.html");
});
app.get("/form.html", function(req, res) {
    //always include __dirname to get directory 
    res.sendFile(__dirname + "/form.html");
});



    var db_config = {
    host: 'us-cdbr-east-06.cleardb.net',
    user: 'b541984daea7e3',
    password: 'fa54833f',
    database: 'heroku_2e87543418faec5',
};

var connection;

function handleDisconnect() {
    // Recreate the connection
    connection = mysql.createConnection(db_config);
    app.use(express.static('public'));
    // The server is either down
    connection.connect(function(err) {
        if (err) {
            console.log('error when connecting to db:', err);
            //delay before attempting to reconnect,
            setTimeout(handleDisconnect, 2000);
        }
    });

    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {} else {
            throw err;
        }
    });
}
handleDisconnect();


app.get('/results', (req, res) => {
    const searchTerm = req.query.route;
    const sql = 'SELECT * FROM playbook WHERE route = ?';
    const params = [searchTerm];
    const messages = {
        success: 'Your search results:',
    };
    connection.query(sql, params, function(error, results, fields) {
        if (error) throw error;
        res.render('results.ejs', { data: results, messages });
    });
});
// Handle form submission
app.post('/submit', (req, res) => {
    const route    = req.body.route;
    const account  = req.body.account;
    const address  = req.body.address;
    const contact  = req.body.contact;
    const location = req.body.location;
    const parking  = req.body.parking;
    const delivery = req.body.delivery;
    const stack    = req.body.stack;
    const advice   = req.body.advice;

    // Insert data into MySQL database
    connection.query(
        'INSERT INTO playbook (route, account, address,contact, location, parking, delivery, stack, advice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [route, account, address, contact, location, parking, delivery, stack, advice],
        (err, result) => {
            if (err) {
                console.log('Error inserting data into MySQL database: ', err);
                res.send(`
          <script>
            alert("Error submitting form!");
            window.location.href = "/form.html";
          </script>
        `);

            } else {
                console.log('Data inserted into MySQL database!');
                res.send(`
          <script>
            alert("Form submitted successfully!");
            window.location.href = "/form.html";
          </script>
        `);
            }
        }
    );
});

// GET route for displaying the edit form
app.get('/edit/:account', function(req, res) {
    // Get the ID of the record to edit from the URL parameter
    var account = req.params.account;

    // Retrieve the corresponding record from MySQL
    var sql = "SELECT * FROM playbook WHERE account = ?";
    connection.query(sql, [account], function(err, result) {
        if (err) throw err;

        // Render the edit form with the record data
        res.render('edit.ejs', { title: 'Edit Record', record: result[0] });
    });
});

// POST route for handling the edit form submission
app.post('/edit', function(req, res) {
    // Get the ID of the record to edit from the URL parameter
    var account = req.params.account;

    // Get the form data from the request body
    var route    = req.body.route;
    var account  = req.body.account;
    var address  = req.body.address;
    var contact  = req.body.contact;
    var location = req.body.location;
    var parking  = req.body.parking;
    var delivery = req.body.delivery;
    var stack    = req.body.stack;
    var advice   = req.body.advice;

    // Update the corresponding record in MySQL
    var sql = "UPDATE playbook SET route=?, account=?, address=?, contact=?, location=?, parking=?, delivery=?, stack=?, advice=? WHERE account=?";
    connection.query(sql, [route, account, address, contact, location, parking, delivery, stack, advice, account], function(err, result) {
        if (err) {
            console.log('Error inserting data into MySQL database: ', err);
            res.send(`
          <script>
            alert("Error updating form!");
            window.location.href = "/edit.ejs";
          </script>
        `);

        } else {
            console.log('Data was succesfully updated in MySQL database!');
            res.send(`
          <script>
            alert("Form was successfully updated!");
            window.location.href = "/";
          </script>
        `);
        }

    });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server has started in host 3000");
});