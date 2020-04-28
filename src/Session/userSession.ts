import KeyManager from './keyManager';
class userSession {
    private static instance: userSession;

    private constructor() { 
        this.wallet=false;
    }

    public static getInstance(): userSession {
        if (!userSession.instance) {
            userSession.instance = new userSession();
        }

        return userSession.instance;
    }
    wallet : boolean;

    public loginWithPrivateKey(key:string){
        if(!this.isLoggedIn()){
            console.log("Logged with key: "+key);
            this.wallet=true;
        }else{
            console.log("You are still loggedIn");
        }
    }

    public logOut(){
        this.wallet=false;
        console.log("Longin out");
    }

    public isLoggedIn() : boolean{
        return this.wallet;
    }
}

/**
 * The client code. Must be deleted
 */
/*
function clientCodes() {
    const s1 = userSession.getInstance();
    const s2 = userSession.getInstance();

    if (s1 === s2) {
        console.log('Singleton works, both variables contain the same instance.');
    } else {
        console.log('Singleton failed, variables contain different instances.');
    }
    s1.loginWithPrivateKey("BestPass");
    console.log(s1.isLoggedIn());
    s2.isLoggedIn();
    s2.logOut();
    s1.isLoggedIn();
}

clientCodes();
*/

export default userSession;