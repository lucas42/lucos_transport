# lucos Transport
A web app for keeping track of public transport, particularly on forms of transport where data connections are highly variable.

## Dependancies
* nodejs
* npm

## Forms of transport currently supported:
* London Underground
* Docklands Light Railway
* London Overground
* London River Bus Services
* TFLRail

## Setup

### Development
To set up the app run:

* ```npm install```
* ```npm run build```
* ```npm start```

### Testing
To run unit tests using [ava](https://github.com/avajs/ava), run:

* ```npm install```
* ```npm test```

## Production

* ```npm install --production```  (or `--only=production` on more recent version of npm)
* ```npm run build```
* ```npm start```

You should also set the following environment variables:
TFLAPPID and TFLAPPKEY - information about TFL's API can be found at https://api-portal.tfl.gov.uk/docs
The app appears to run fine without these being set, but registering for an ID and key helps to keep track of which apps are making which requests to the API.