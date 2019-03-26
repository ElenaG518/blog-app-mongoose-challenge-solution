'use strict';

// 5c99408b6b1bdb9f6e8ec6b5 elena.granados Elena Granados

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { Author, BlogPost } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(express.json());

// Authors: code from blog-api

app.get('/authors', (req, res) => {
  Author
  // this call returns a promise
  .find()
  // if successful
  .then(authors => {
      // send response as an object with key authors and value as array of authors
      res.json({  
      authors: authors.map(author => author.serialize()) 
      })
  })
  // if failed
  .catch(err => {
      console.error(err);
      res.status(500).json({message: "Something went wrong"})
  });
});

// author get by id
app.get('/authors/:id', (req, res) => {
  Author
  .findById(req.params.id)
  .then(author => {
      res.json(author.serialize());
  })
  .catch(err => {
      console.error(err);
      res.status(500).json({message: "Something went wrong"})
  });
});

// author post a new author
app.post('/authors', (req, res) => {
  // make sure all required fields have values
  const requiredFields = ["firstName", "lastName", "userName"];
  requiredFields.forEach(field => {
      if (!field == req.body) {
          const message = `${field} is missing in req body`;
          console.error(message);
          res.status(500).json({message})
      }
  });

  // make sure the username is not already taken
  const {firstName, lastName, userName} = req.body;

 Author
 .findOne({userName})
 .then(author => {
          if (author) {
              const message = "That username is already taken";
              res.status(400).json({message});
          } else {
              const newAuthor = {
                  firstName,
                  lastName,
                  userName
          };

          Author
          .create(newAuthor)
          .then(author => {
              res.status(201).json(author.serialize())
          })
          .catch(err => {
              const message = "Something went wrong";
              res.stat(500).json({message});
          })
      }
  })
  .catch(err => {
  const message = "Something went wrong";
  res.stat(500).json({message});
  });
});

app.put('/authors/:id', (req, res) => {
  //make sure req.params.id and req.body.id are valid and that they match
  if(!(req.params.id && req.body.id && req.params.id == req.body.id)) {
      console.log(`params: ${req.params.id} and  body: ${req.body.id}`);
      const message = `${req.params.id} and ${req.body.id} don't match`;
      console.error(message);
      res.status(400).send(message);
  } else {
      // make sure the updatable fields are reinitialized with the new values

      const updatedItem = {};
      const updateableFields = ["firstName", "lastName", "username"];

      //   updateableFields.forEach(field => {
      //     if (field in req.body) {
      //       toUpdate[field] = req.body[field];
      //     }
      //   });

      const bodyKeys = Object.keys(req.body);
      
      updateableFields.forEach(field => {           
          bodyKeys.forEach(key => {
              console.log("field ", field, "key ", key);
              if (field == key) {
                  // field must be in brackets because it is a string
                  console.log("in here ", req.body[key]);
                  updatedItem[field] = req.body[key]; 
              }    
          })
      })    
      console.log("update ", updatedItem);

      // check to make sure username is not already taken
      Author
      .findOne({userName: req.body.userName})
      .then(author => {
          if (author) {
              res.status(400).json({message: "That username is already taken"});
          } else {
              // get the author with the same id as params.body.id
              Author
              // all key/value pairs in toUpdate will be updated -- that's what `$set` does
              // { new: true } - if you are asking to return the new value
              .findOneAndUpdate({_id: req.params.id}, {$set: updatedItem}, { new: true })
              .then(updatedAuthor => {
                  res.status(202).json(updatedAuthor.serialize());
              })
          }
      })
      .catch(err => {
          res.status(500).send("Something went wrong in .findOne")
      });
  }       
});
 
app.delete("/authors/:id", (req, res) => {
  BlogPost
  // first remove all posts for that author
    .remove({author: req.params.id})
    .then(() => {
      // then remove teh author
      Author
      .findByIdAndRemove(req.params.id)
      .then(() => {
        console.log(`Deleted blog posts owned by and author with id \`${req.params.id}\``);
        res.status(204).json({message: "Success"})
      })
      .catch(err => res.status(500).json({message: "could not delete author document"}));
    })  
    .catch(err => res.status(500).json({message: "Could not delete author's blogposts"}));
});    

app.get('/posts', (req, res) => {
  BlogPost
    .find()
    .then(posts => {
      res.json(posts.map(post => post.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'could not retrieve posts' });
    });
});

app.get('/posts/:id', (req, res) => {
  BlogPost
    .findById(req.params.id)
    .then(post => {
      console.log("post ", post);
      res.json(post.serialize())
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'could not retrieve post with that id' });
    });
});

app.post("/posts", (req, res) => {
  const requiredFields = ["title", "content", "authorId"];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
    
  }) 

  Author
    .findById(req.body.authorId)
    .then(author => {
      
      if (author) {
                
        BlogPost
        .create({
          title: req.body.title,
          content: req.body.content,
          author: author
        })
        .then( blog => res.status(201).json(blog.serialize()))
        .catch(err => {
          console.error(err);
          res.status(500).json({ message: "Internal server error" });
        });
      }
      else { 
        const message = "Author not found";
        console.error(message);
        res.status(400).send(message);
      }
     }) 
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
  });

app.put('/posts/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
  }

  const updated = {};
  const updateableFields = ['title', 'content'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  console.log("update ", updated);
  
  BlogPost
    .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(updatedPost => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Something went wrong' }));
});




app.delete('/posts/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .then(post => res.status(204).json({ message: 'success' }))
    .catch(err => { res.status(500).json({ error: 'Could not delete post' });
    });
});

app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, { useNewUrlParser: true }, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
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

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };
