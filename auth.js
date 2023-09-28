/**
 * 
 */

const { createServer } = require('http'),
{ StringDecoder } = require('string_decoder'),
{ sendResponse } = require('./helper'),
{ readFileSync } = require('fs'),
{ log } = require('console');

let config = {};


//Read Config
try {
    let info = readFileSync('./.config', 'utf8');
    config = JSON.parse(info);
} catch (error) {
    log(error.message);
    return;
}

//Start Application
const server  = createServer((request, response) => {

    let headers = request.headers,
    method = request.method.toUpperCase(), 
    data = {};

    if(
        ['GET', 'HEAD'].includes(method)
    ){
        data = request.query;
    }
    else if(
        ['POST', 'PUT', 'PATCH'].includes(method)
    ){

        // Handle POST and PUT requests
        const decoder = new StringDecoder('utf-8');
        let requestData = '';

        request.on('data', (data) => {
            requestData += decoder.write(data);
        });

        data = requestData;

    }
    else {
        sendResponse({
            status : 2,
            message : "Invalid Request Method",
            code : "C000",
            headCode : 500
        },
        response);
        return;
    }

    //Run The Module
    runModule(
        response,
        request.url,
        headers,
        data
    );
});


//Run the module
function runModule(
    response,
    url,
    header,
    data
){
  log(url);  
  log(header);  
  log(data);  
}


server.listen(Number(config.port ), () => {
    log(`Server Running on Port : ${config.port} | Started on ${new Date()}`);
});