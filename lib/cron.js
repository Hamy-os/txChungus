//Requires
const modulename = 'cron';
const axios = require("axios");
const { dir, log, logOk, logWarn, logError } = require('./console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };


/**
 * txChungus bot class
 */
module.exports = class Cron {
    constructor(config) {
        this.config = config;
        log('Setting up Cron');

        this.updateChangelog('windows', true);
        this.updateChangelog('linux', true);
        setInterval(()=>{
            this.updateChangelog('windows');
            this.updateChangelog('linux');
        }, 60*1000);
    }

    //================================================================
    async updateChangelog(osType, firstTime = false){
        try {
            //perform request - cache busting every ~33m
            const osTypeApiUrl = (osType == 'windows')? 'win32' : 'linux';
            // const osTypeApiUrl = 'win32';
            const cacheBuster = Math.floor(now() / 2e3) % 1000;
            const reqUrl = `https://changelogs-live.fivem.net/api/changelog/versions/${osTypeApiUrl}/server?${cacheBuster}`;
            const changelogReq = await axios.get(reqUrl);
    
            //check response
            if(!changelogReq.data) throw new Error('request failed');
            const changelog = changelogReq.data;
            if(anyUndefined(changelog.recommended, changelog.optional, changelog.latest, changelog.critical)){
                throw new Error('expected values not found');
            }
    
            //fill in databus
            const osTypeRepoUrl = (osType == 'windows')? 'server_windows' : 'proot_linux';
            GlobalData.fxserverVersions[osType] = {
                latest: parseInt(changelog.latest),
                optional: parseInt(changelog.optional),
                critical: parseInt(changelog.critical),
                recommended: parseInt(changelog.recommended),
                recommended_download: changelog.recommended_download,
                optional_download: changelog.optional_download,
                latest_download: changelog.latest_download,
                critical_download: changelog.critical_download,
                artifactsLink: `https://runtime.fivem.net/artifacts/fivem/build_${osTypeRepoUrl}/master/?${cacheBuster}`,
            }
            if(firstTime) log(`${osType} fxserver versions updated`);
        } catch (error) {
            // logWarn(`Failed to retrieve FXServer ${osType} update data with error: ${error.message}`);
            if(firstTime) dir(error.message)
        }
    }

} //Fim Cron()
