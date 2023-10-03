const { log } = require('console');

const contentType = {
    'Content-Type': 'text/plain'
};

const sendResponse = async (data, response) => {
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');


    try {
        response.writeHead(
            Number(data.headCode),
            contentType
        );

        let responseData;

        //Remove the Code
        delete data.headCode;

        if(typeof data === 'string'){
            responseData = data;
        }else{
            responseData = JSON.stringify(data);
        }

        response.end(responseData);
        
    } catch (error) {
        log(error.message);
        response.writeHead(500, contentType);

        response.end(JSON.stringify({
            status: 2,
            code : 'C001',
            message : "Request Error"
        }));
    }

}

module.exports = {
    sendResponse
}