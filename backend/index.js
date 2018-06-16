'use strict';

const express = require('express');
const superagent = require('superagent');

const app = express();

require('dotenv').config();

const GOOGLE_OAUTH_URL = 'https://www.googleapis.com/oauth2/v4/token';
const OPEN_ID_URL = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

app.get('/oauth/google', (request, response) => {
  console.log('__STEP 3.1__ - receiving code');
  console.log(request.query);

  if (!request.query.code) {
    response.redirect(process.env.CLIENT_URL);
  } else {
    console.log('__CODE__', request.query.code);
    console.log('__STEP 3.2__ - sending code back');

    return superagent.post(GOOGLE_OAUTH_URL)
      .type('form')
      .send({
        code: request.query.code,
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: `${process.env.API_URL}/oauth/google`,
      })
      .then((tokenResponse) => {
        console.log('__STEP 3.3__ - access token');
        console.log(tokenResponse.body);

        if (!tokenResponse.body.access_token) {
          response.redirect(process.env.CLIENT_URL);
        }
        const accessToken = tokenResponse.body.access_token;

        return superagent.get(OPEN_ID_URL)
          .set('Authorization', `Bearer ${accessToken}`);
      })
      .then((openIdResponse) => {
        console.log('__STEP 4__ - request to open id api');
        console.log(openIdResponse.body);

        response.cookie('token', 'bleh');
        response.redirect(process.env.CLIENT_URL);
      })
      .catch((error) => {
        console.log(error);
        response.redirect(`${process.env.CLIENT_URL}?error=oauth`);
      });
  }
  return null;
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
