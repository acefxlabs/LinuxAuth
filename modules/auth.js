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
    
    let findUsers = await findUser(body.username, body.home);
    
    // await exec(`awk -F: '{printf "User: %s\tHome Directory: %s\n", $1, $6}' /etc/passwd`
    if(findUsers.status === 2){
        return findUsers;
    }
    
    if (findUsers.status === 1){    

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
                    if(resp.toLowerCase().includes('authentication failure')){
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
    
            validateUser.on('close', 
                (code) => {

                //Successful Login
                // if(code === 0){
                
                //Check my home
                let getMyHome = execSync(
                    `whoami`,
                    execOptions
                );

                resolve({
                    status: 1,
                    message: `Login Successful`,
                    headCode: 200,
                    data: {}
                });

                // if (getMyHome.trim() === body.username) {
                //     //Exit
                //     execSync(
                //         `whoami`,
                //         execOptions
                //     );

                //     resolve({
                //         status: 1,
                //         message: `Login Successful`,
                //         headCode: 200,
                //         data: {}
                //     }); 
                // }

            });
        })

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

const changePassword = async (requestData) => {

    const { body } = requestData;

    const execOptions = {
        encoding: 'utf8',
        shell: 'bash'
    }

    let authentication = await authUser(requestData);

    if(authentication.status !== 1){
        return authentication;
    }

    //Now To Reset Password
    const passwd = spawn(
        'sudo passwd', [body.username],
        // { stdio: ['pipe', 'pipe', 'pipe'] }
        { stdio: ['pipe', 'pipe'] }
    );

    // passwd.stdin.write(body.password + '\n');
    passwd.stdin.write(body.newPassword + '\n');
    passwd.stdin.write(body.newPassword + '\n');
    passwd.stdin.end();

    passwd.stdout.on('data', data => {
        log(data);
    })

    passwd.stdout.on('code', code => {
        log(code);
    })



}

//User Finder Function
async function findUser(user, home){
 
    const execOptions = {
        encoding: 'utf8',
        shell: 'bash'
    }

    let findUsers = {};

    try {

        findUsers = execSync(
            `compgen -u`,
            execOptions
        );

    } catch (error) {
        return {
            status: 2,
            message: "Error Running Command",
            headCode: 500,
            code: "A000"
        }
    }

    //Check Specific user
    const allUsers = String(findUsers).split('\n');
    
    if (!allUsers.includes(user)) {
        return {
            status: 2,
            message: `User (${user}) not found`,
            headCode: 403,
            code: "A001"
        }
    }
    
    let getUserHome = execSync(
        `eval echo "~${user}"`,
        execOptions
    );

    getUserHome = getUserHome.trim();

    //Check if User Home is correct
    if (getUserHome.includes(home)) {
        return {
            status: 1,
            message: "User Home Found",
            data: getUserHome
        }
    }else{
        return {
            status: 2,
            message: `Incorrect user acces`,
            headCode: 403,
            code: "A002"
        }
    }
    
}


module.exports = {
    authUser,
    changePassword
}