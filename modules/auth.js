/**
 * The Auth Module is used to authenticate with On Linux
 * it will use .htpasswd file to do the auth
 */


const { spawn, execSync } = require('child_process'),
{ log } = require('console');

const authUser = async (requestData) => {

    const { body } = requestData,
    execOptions = {
        encoding: 'utf8',
        shell : 'bash'
    }
    
    let findUsers = {}; 
    // await exec(`awk -F: '{printf "User: %s\tHome Directory: %s\n", $1, $6}' /etc/passwd`,
    try {
        
        findUsers = execSync(
            `compgen -u`,
            execOptions
        );

    } catch (error) {
        log(error);
        return {
            status: 2,
            message: "Error Running Command",
            headCode: 500,
            code : "A000"
        }
    }

    const allUsers = findUsers.split('\n');
    
    if(allUsers.includes(body.username)){

        let getUserHome = execSync(
            `eval echo "~${body.username}"`,
            execOptions
        );

        getUserHome = getUserHome.trim();

        //Check if User Home is correct
        if(getUserHome !== body.home){
            return {
                status: 2,
                message: `Incorrect user acces`,
                headCode: 403,
                code: "A002"
            }
        }

        //Validate Password
        return new Promise(resolve => {
            
            const validateUser = spawn(`su ${body.username}`, {
                shell: true,
                stdio: 'pipe'
            });

            validateUser.stdin.write(`${body.password}\n`);
            
            validateUser.stdin.end();
            
            validateUser.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            validateUser.stderr.on('data', (data) => {
                const resp = String(data);
                if(resp.toLowerCase() === 'password'){
                }else{
                    if(resp.includes('Authentication failure')){
                        resolve({
                            status: 2,
                            message: `Incorrect Username / Password`,
                            headCode: 403,
                            code: "A003"
                        })
                    }
                }
                console.error(`stderr: ${data}`);
            });
    
            validateUser.on('close', (code) => {
                console.log(`child process exited with code ${code}`);

                //Successful Login
                if(code === 0){
                    //Check my home
                    let getMyHome = execSync(
                        `whoami`,
                        execOptions
                    );
                    
                    if(getMyHome.trim() === body.username){
                        //Exit
                        execSync(
                            `whoami`,
                            execOptions
                        );

                        resolve({
                            status: 1,
                            message: `Login Successful`,
                            headCode: 200,
                            data : {}
                        });
                    }
                }

            });
        })

    } else {
        return {
            status: 2,
            message: `User (${body.username}) not found`,
            headCode: 403,
            code : "A001"
        }
    }



    // let authenticate = {
    //     username : body.username,
    //     password : body.password
    // };

    // pamAuthenticatePromise(authenticate)
    // .then(resp => {
    //     log(resp);
    // })
    // .catch(error => {
    //     log(error);
    // })

}

module.exports = {
    authUser
}