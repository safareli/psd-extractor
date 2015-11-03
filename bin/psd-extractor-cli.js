#!/usr/bin/env node

var psdExtractor = require("../lib/psd-extractor.js")
var program = require('commander');
var R = require('ramda');
var package = require('../package');


function logAsJSON(obj){
  console.log(JSON.stringify(obj,null,4));
  return obj;
}



program
  .version(package.version)
  .description(package.description)
  .usage('<file ...>')
  .parse(process.argv);

logAsJSON(
  psdExtractor(
    R.isEmpty(program.args) 
      ? '*.psd' 
      : program.args
  )
)