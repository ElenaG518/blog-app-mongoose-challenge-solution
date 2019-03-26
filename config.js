'use strict';

exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://my-new-user:mexico98@ds149742.mlab.com:49742/blog-app";
  
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "mongodb://user:pass123@ds221095.mlab.com:21095/blog-testing";
exports.PORT = process.env.PORT || 8080;

