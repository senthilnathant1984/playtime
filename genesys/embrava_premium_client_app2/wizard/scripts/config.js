export default {
    clientID: '9e5c96b7-7adc-477f-8817-414811649e69',
    redirectUri: 'https://embrava.github.io/genesys/embrava_premium_client_app2/wizard/index.html',	
    appName: 'premium-app-embrava',
    premiumAppURL: 'https://embrava.github.io/genesys/embrava_premium_client_app2/index.html',
	
    defaultPcEnvironment: 'mypurecloud.com',
    defaultLanguage: 'en-us',
    
    //Permissions required for running the Wizard App
    setupPermissionsRequired: ['admin'],

    viewPermission: 'integration:embravaApps:view',
	
    // To be added to names of PureCloud objects created by the wizard
    //"prefix": "STATUS_LIGHTS_FOR_PURECLOUD_",
    prefix: "Status Lights for PureCloud ",
    prefixAppName: "Status Lights"
}