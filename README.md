TweetMapper
===========

Interactive Twitter Choropleths aka "TweetMaps"

TweetMapper is a Node.js app that uses the Twitter Search API, WebSockets, and D3 data visualizations to create interactive, real-time state-level heat maps that visualize what's trending in Twitter, and where it's trending.

http://tweetmapper.us

## Installation Instructions

Assuming that you have [Node.js](http://nodejs.org/) (version 0.10 or greater), and Git installed on your machine:

```sh
git clone https://github.com/databass/tweetmapper.git # or clone your own fork
cd tweetmapper
npm install
# edit Twitter API Codes in twitterCodes.js (see below)
node app.js
```
Your app should now be running on [localhost:3000](http://localhost:3000/).

If you'd like to run on a different port, you can enter that port number as a parameter, e.g.
```sh
node app.js 5000
```
Your app should now be running on [localhost:5000](http://localhost:5000/).

## Twitter API Codes

Note that before running 'node app.js', you will need to add your Twitter API Codes (consumer_key, consumer_secret, access_token_key and access_token_secret) in order to complete the installation of this app. You can modify these codes in 'twitterCodes.js' which is at the root of the application. Since this Node module exists as a parent of the public directory, these API codes will not be exposed to the public.

To change these codes, make a quick edit to twitterCodes.js, located in the root folder. Change each of the four 'xxx' values to your own codes.

```js

exports.getTwitterCodes = function() {

    return {
        consumer_key : "xxx",
        consumer_secret : "xxx",
        access_token_key : "xxx",
        access_token_secret : "xxx"
    };

};
```






