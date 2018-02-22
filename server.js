const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
var cors = require('cors')

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

const app = express();
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/accesstoken', (req, res) =>{
  var url= "https://accounts.spotify.com/api/token"
  res.json("hi");

  // url: "https://accounts.spotify.com/api/token",
  // data: {
  //     grant_type: 'client_credentials'
  // },
  // headers: {
  //     Authorization: `Basic NDIyYjkwZTIzNDFlNDUwZjliYTg5Y2JkMzI3OGUyMzk6ZDdmY2NlZDUwOTg5NDlkM2IwM2FlZDM5MmNkNjEyMDU=`,

  // }

})
// app.use('*', function(req, res) {
//   return res.status(404).json({message: 'Not Found'});
// });

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};