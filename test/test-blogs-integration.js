'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const uuid = require("uuid");

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

const { Author, BlogPost } = require('../models');
const { runServer, app, closeServer } = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

const authorData = [];

function seedAuthorData() {
  console.info("seeding author data");
  const userName = ["pachi", "kenji", "chichiri", "pera", "malu", "raul", "luis", 'marce', "gaby", "cliff"];
  for (let i=0; i< 10; i++) {
    authorData.push(generateAuthorData(userName[i])); 
   }
  //  console.log(authorData);
   return Author.insertMany(authorData);
}

function generateAuthorData(userName) {
  const authorItem = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    userName: userName
    
  };

  // console.log("authorItem ", authorItem);
  return authorItem;
}

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
// function seedBlogPostData() {
//   console.info('seeding blog data');
//   const seedData = [];

//   for (let i=0; i<10; i++) {
    
//     seedData.push(generateBlogPostData(i));
//   }
//   // this will return a promise
//   console.log(seedData);
//   return BlogPost.insertMany(seedData);
// }

// generate an object represnting a blog.
// can be used to generate seed data for db
// or request.body data
function generateBlogPostData() {

  const seedData = [];
    return Author
    .find()
    .then( function(authors) {
        // console.log("generateBlog ", authors[0]);
        
        for (let i=0; i<authors.length; i++) {
          const authorData = {
            _id: authors[i]._id,
            firstName: authors[i].firstName,
            lastName: authors[i].lastName,
            userName: authors[i].userName
          };

          // console.log("authorData in generateBlogs ", authorData);
  
          const blogItem = {
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraph(),
            author:  authorData          
          };
        
          seedData.push(blogItem);
        }

        // console.log("seedData ", seedData[0]);
        return BlogPost.insertMany(seedData);
    });    
}

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('BlogPosts API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedBlogData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedAuthorData()
    
  });

  beforeEach(function() {
    return generateBlogPostData()
    
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {

    it('should return all existing authors', function() {
      // strategy:
      //    1. get back all authors returned by GET request to `/authors`
      //    2. prove res has right status, data type
      //    3. prove the number of authors we got back is equal to number
      //       in db.
      //

      // need this variable so we can reference it throughout the function
      // liek in the second .then call
      let res;
      return chai.request(app)
        .get('/authors')
        .then(function(_res) {
          res = _res;
          // console.log("res ", res.body);
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res).to.be.json;
          expect(res.body.authors).to.be.a("array");
          expect(res.body.authors).to.have.lengthOf.at.least(1);
          (res.body.authors).forEach(function(author) {
            expect(author).to.be.a("object");
            expect(author).to.have.all.keys("id", "name", "userName");
          });
          return Author.countDocuments();
        })
        .then(function(count) {
          expect(res.body.authors).to.have.lengthOf(count);
        });
    });

    it('should return all existing blogs', function() {
      // strategy:
      //    1. get back all blogs returned by GET request to `/posts`
      //    2. prove res has right status, data type
      //    3. prove the number of blogs we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          // console.log("all blogs ", _res.body);
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          return BlogPost.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should return blogs with right fields', function() {
      // Strategy: Get back all blogs, and ensure they have expected keys

      let resBlogPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          // console.log("get blogs ", res.body);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);
	        res.body.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'author', 'title', 'content', 'comments', 'id');
          });

          resBlogPost = res.body[0];
          //  console.log("resBlogPost ", resBlogPost);
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {
          // console.log("post in test ", post);
          expect(resBlogPost.id).to.equal(post.id);
          // expect(resBlogPost.author).to.equal(post.author);
          expect(resBlogPost.title).to.equal(post.title);
          expect(resBlogPost.content).to.equal(post.content);          
         expect(resBlogPost.comments.length).to.equal(post.comments.length);  
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the blog we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blog', function() {
      const newBlogPost = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph()
      };

      const authorData = {}
        
        return Author
        .findOne()
        .then(function (author) {
            // console.log("post author ", author);
            newBlogPost.authorId = author._id;
            authorData.name = `${author.firstName} ${author.lastName}`.trim();
                        
            return chai.request(app)
            // why does it drop the author db so taht author is not found through Id on server?
            .post('/posts')
            .send(newBlogPost);  
        })
        .then(function(res) {
          // console.log("post res ", res.body);
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'author', 'title', 'content', 'comments');    
          expect(res.body.author).to.equal(authorData.name);
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.title).to.equal(newBlogPost.title);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          
        });                    
    });    

    it("Should error if not supplied all required values", function() {
        const badRequestData = {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph()
        };
        return chai.request(app)
        .post("/posts")
        .send(badRequestData)
        .then(function (res) {
            expect(res).to.have.status(400);
        });
    });
  });  

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing blog from db
    //  2. Make a PUT request to update that blog
    //  3. Prove blog returned by request contains data we sent
    //  4. Prove blog in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        title:'I wish I could Make this work',
        content: 'To complete this challenge, we\'d like you to add integration tests for all four of the API endpoints.'
      };

      return BlogPost
        .findOne()
        .then(function(post) {
          console.log("put post ", post)
          updateData.id = post._id;
          console.log("updateData ", updateData);
          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${post._id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        .then(function(post) {
          console.log("second put post ", post);
          expect(post.title).to.equal(updateData.title);
          expect(post.content).to.equal(updateData.content);
          // expect(post._id).to.equal(updateData._id);
        });
    });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a blog
    //  2. make a DELETE request for that blog's id
    //  3. assert that response has right status code
    //  4. prove that blog with the id doesn't exist in db anymore
    it('delete a blog by id', function() {

      let post;

      return BlogPost
        .findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });
});















