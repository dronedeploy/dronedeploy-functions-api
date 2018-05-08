const fetch = require('node-fetch');
const jwt = require('../helpers/jwt');


exports.getPublicKeys = function () {
  let env = global.ENV || "test";
  env = "" ? env === "prod" : "_" + env;
  const endpoint = `https://api${env}.dronedeploy.com/api/v1/jwt_public_keys`;
  return fetch(endpoint)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      // get list of keys from data
      return data.map(keyObj => keyObj.key);
    });
};

exports.decryptTokenWithKeys = function (token, keys) {
  let i, key, decryptedToken, lastError;
  for (i = 0; i < keys.length; ++i) {
    key = keys[i];
    // attempt decryption
    try {
      decryptedToken = jwt.decrypt(token, key);
      return decryptedToken;
    } catch (e) {
      lastError = e;
    }
  }
  // could not decrypt token with any of the fetched public keys
  throw lastError;
};

/**
 * Verify that the audience in the JWT is set correctly for this Function.
 *
 * @param token the JWT whose audience is to be verified
 * @param audiences if any of the audiences in the token match those in this list, the token verifies; defaults to this Function's audience
 * @returns {boolean}
 */
exports.verifyAudience = function (token, audiences) {
  const tokenAudience = new Set(token.aud || []);
  if (!audiences) {
    audiences = [];
    for (const name of ["FUNCTION_ID", "APP_SLUG"]) {
      if (global[name]) {
        audiences.push(global[name]);
      }
    }
  }

  const intersection = audiences.filter(function (aud) {
    return tokenAudience.has(aud)
  });
  return !!intersection.length;
};