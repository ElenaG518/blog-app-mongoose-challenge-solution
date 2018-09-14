'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

const { BlogPost } = require('../models');
const { runServer, app, closeServer } = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedBlogPostData() {
  console.info('seeding blog data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogPostData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

// used to generate data to put in db
function generateTitleName() {
  const titles = [
    'Mind over Body', 'I Kick Ass at Making Money', 'I love Money and Money Loves Me', 'Think and Grow Rich', 'Love Coding'];
  return titles[Math.floor(Math.random() * titles.length)];
}

// generate an object represnting a blog.
// can be used to generate seed data for db
// or request.body data
function generateBlogPostData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }
    title: generateTitleName(),
    content: lorem.paragraph(),
    created: date.past(),
  };
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
    return seedBlogPostData();
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
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.posts).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.posts).to.have.lengthOf(count);
        });
    });


    it('should return blogs with right fields', function() {
      // Strategy: Get back all blogs, and ensure they have expected keys

      let resBlogPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.posts).to.be.a('array');
          expect(res.body.posts).to.have.lengthOf.at.least(1);

	      res.body.posts.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'author', 'title', 'content', 'created');
          });
          resBlogPost = res.body.posts[0];
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {

          expect(resBlogPost.id).to.equal(post.id);
          expect(resBlogPost.author.firstName).to.equal(post.author.firstName);
          expect(resBlogPost.author.lastName).to.equal(post.author.lastName);
          expect(resBlogPost.title).to.equal(post.title);
          expect(resBlogPost.content).to.equal(post.content);
          expect(resBlogPost.created).to.equal(post.created);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the blog we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blog', function() {

      const newBlogPost = generateBlogPostData();
      let mostRecentGrade;

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'name', 'cuisine', 'borough', 'grade', 'address');
          expect(res.body.name).to.equal(newRestaurant.name);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.cuisine).to.equal(newRestaurant.cuisine);
          expect(res.body.borough).to.equal(newRestaurant.borough);

          mostRecentGrade = newRestaurant.grades.sort(
            (a, b) => b.date - a.date)[0].grade;

          expect(res.body.grade).to.equal(mostRecentGrade);
          return Restaurant.findById(res.body.id);
        })
        .then(function(restaurant) {
          expect(restaurant.name).to.equal(newRestaurant.name);
          expect(restaurant.cuisine).to.equal(newRestaurant.cuisine);
          expect(restaurant.borough).to.equal(newRestaurant.borough);
          expect(restaurant.grade).to.equal(mostRecentGrade);
          expect(restaurant.address.building).to.equal(newRestaurant.address.building);
          expect(restaurant.address.street).to.equal(newRestaurant.address.street);
          expect(restaurant.address.zipcode).to.equal(newRestaurant.address.zipcode);
        });
    });
  });

















