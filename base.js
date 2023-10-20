/**
 * 
 */

const { createServer } = require('http'),
{ StringDecoder } = require('string_decoder'),
{ sendResponse } = require('./helper'),
{ readFileSync } = require('fs'),
url = require('url'),
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

    log('request In');

    let headers = request.headers,
    method = request.method.toUpperCase(), 
    body = {},
    query = {};

    //Incase Params is passed in URL get it here
    const parsedUrl = url.parse(request.url, true),
    params = new Object(parsedUrl.query);

    for (let key in params) {
        query[key] = params[key];
    }

    if(
        ['GET', 'HEAD'].includes(method)
    ){
        //Run The Module
        runModule(
            {
                url: parsedUrl.pathname,
                headers : headers,
                method : method,
                query : query,
                body : body
            },
            response
        );
    }
    else if(
        ['POST', 'PUT', 'PATCH'].includes(method)
    ){

        // Handle POST and PUT requests
        const decoder = new StringDecoder('utf-8');
        let requestData = '';

        request
        .on('data', (data) => {
            requestData += decoder.write(data);
        })
        .on('end', () => {
            requestData += decoder.end();

            body = JSON.parse(requestData);

            //Run The Module
            runModule(
                {
                    url: parsedUrl.pathname,
                    headers: headers,
                    method: method,
                    query: query,
                    body: body
                },
                response
            );
        });

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

});


//Run the module
async function runModule(
    requestData,
    response,
){
    //Due to security reason its important we have a way to ensure request is authorized
    if(
        !('authorization' in requestData.headers)
    ){
        sendResponse({
            status: 2,
            message: "Unathorized Request",
            code: "C002",
            headCode: 401
        }, 
        response);

        return;
    } else {

        let check = config.allowedAuth.filter(x => {
            return x.code === requestData.headers.authorization 
        });
        
        if(check.length === 0){
            sendResponse({
                status: 2,
                message: "Unathorized Request",
                code: "C002",
                headCode: 401
            },
            response);
        }

        body = {...requestData.body, ...check[0] };
        requestData.body = body;
    }

    //Split url to get data
    // const urlSplit = 
    const pathSegments = requestData.url.split('/').filter(segment => segment !== '');
    
    if(pathSegments.length === 1){
        pathSegments.push('index');
    }

    //construct path to file
    let path = '.',
        endPoint = '';
    pathSegments.forEach((seg, index) => {
        if(index < (pathSegments.length - 1)){
            path += `/${seg}`;
        }else{
            endPoint = pathSegments[pathSegments.length - 1];
        }
    });

    try {
        const module = require(path);

        const modResponse = await module[endPoint]({
            headers : requestData.headers,
            query : requestData.query,
            body : requestData.body
        });
        // log(modResponse);

        sendResponse(modResponse, response);

    } catch (error) {
        log(error.message);
        sendResponse({
            status : 2,
            message : "Error Running Request",
            headCode : 500,
            code : "C003"
        });
        
    } 
}


server.listen(Number(config.port ), () => {
    log(`Server Running on Port : ${config.port} | Started on ${new Date()}`);
});