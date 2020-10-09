'use strict';

var lsc3l_config = function() {};
lsc3l_config.confEndPointsOur = ["https://node-001.cchosting.org","https://node-002.cchosting.org","https://node-003.cchosting.org","https://node-004.cchosting.org","https://node-cc-001.cchosting.org/","https://api.monnaie-leman.org"];
lsc3l_config.confEndPointsOther = ["https://ipfs.io","https://ipfs.infura.io","https://ipfs.jes.xxx","https://siderus.io","https://hardbin.com","https://ipfs.infura.io","https://xmine128.tk"];

lsc3l_config.configRepo = "/ipns/Qmcir6CzDtTZvywPt9N4uXbEjp3CJeVpW6CetMG6f93QNt/configs";  // IPNS of the list of available ComChain currency configs
lsc3l_config.nodesRepo = "/ipns/Qmb2paHChFzvU9fnDtAvmpbEcwyKfpKjaHc67j4GCmWLZv"; // IPNS of the list of available ComChain end-points
lsc3l_config.ping = lsc3l_config.configRepo+'/ping.json';


////////////////////////////////////////////////////////////////////////////////

var lsc3l_connection = function() {}
///
// [High level] Look for an available IPFS/IPNS node and store it in the localstorage under 'ComChainRepo'
///
lsc3l_connection.ensureComChainRepo = function(callback) {
    // 1. Check if a list of end-point is stored locally (avoid a IPNS slow call)
    var storedEndPoints=[];
    try{
          storedEndPoints = JSON.parse(localStorage.getItem('ComChainApiNodes')); 
    } catch(e){
        storedEndPoints=[];
    }
     
    checkRepo(storedEndPoints, function (result_stored){
         if (result_stored){
             callback(true);
         } else {
             // 2. No locally stored nodes available, try the hard-coded Com-Chain list
             checkRepo(lsc3l_config.confEndPointsOur,function (result){
                 if (result){
                     callback(true);
                 } else {
                     // 3. As a backup try standard ipfs servers
                     checkRepo(lsc3l_config.confEndPointsOther, callback);
                 }
             });
         }
     });
 }

///
// [High level] Get the list of end-points and randomly select a up and running one
///
lsc3l_connection.acquireEndPoint = function(callback) {
    lsc3l_connection.getCCEndPointList(function(list_success) {
        if (list_success) {
            endpoint_list = JSON.parse(localStorage.getItem('ComChainApiNodes')); 
            lsc3l_connection.selectEndPoint(endpoint_list, callback);
        } else {
            callback(false);
        }
    });
}
 
///
// [Lower level] Get from the IPFS/IPNS node stored it in the localstorage under 'ComChainRepo' the list of ComChain end-points
/// 
lsc3l_connection.getCCEndPointList = function(callback){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', localStorage.getItem('ComChainRepo') + lsc3l_config.nodesRepo+'?_=' + new Date().getTime(), true); 
    xhr.responseType = 'json';
    xhr.onreadystatechange = function (oEvent) {  
      if (xhr.readyState === 4) {  
        if (xhr.status === 200) { 
            try{
                var to_push = xhr.response;
                if(typeof to_push =='object')
                {
                    to_push = JSON.stringify(xhr.response);
                }
                
                localStorage.setItem('ComChainApiNodes',to_push); 
                callback(true);
            } catch(e){
                callback(false);  
            }  
     
        } else {  
            callback(false);
        }  
      }  
    }; 
    xhr.send();
}

///
// [Lower level] Select a ComChain end-point with up and running APIs
///
lsc3l_connection.selectEndPoint = function(nodes, callback){
    if (nodes.length==0){
        localStorage.removeItem('ComChainApiNodes');
        callback(false);
    } else {
        //randomly select a node (poor man's load balancing)
        var id = Math.floor((Math.random() * nodes.length));
        var node = nodes[id];
        
        // check the node is up and running
        lsc3l_connection.testNode(node,function(success){
            if (success){
                // store the node 
                localStorage.setItem('ComChainAPI', node);
                callback(true);
            }else{
                nodes.splice(id,1);
                lsc3l_connection.selectApiNode(nodes,callback);      
            }
        });
    }
}

///
// [Lower level] Test if a end-point has up and running APIs
///
lsc3l_connection.testNode = function(api_address,callback) {
    testDbApi(api_address, function(result){
        if (result){
            testApi(api_address, callback);
        } else {
            callback(false);
        }
    });
}
////////////////////////////////////////////////////////////////////////////////

var lsc3l_customisation = function() {}

///
// [High level] Get the configuration for a given currency, store it in the locale storage 'ComChainServerConf'
///
lsc3l_customisation.getConfJSON = function(name, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', localStorage.getItem('ComChainRepo')+ lsc3l_config.configRepo+'/' +name+'.json', true); //
    xhr.responseType = 'json';
    xhr.onreadystatechange = function (oEvent) {  
      if (xhr.readyState === 4) {  
        if (xhr.status === 200) { 
          try{
             var to_push = xhr.response;
                    if(typeof to_push =='object')
                    {
                        to_push = JSON.stringify(xhr.response);
                    }  
              
            localStorage.setItem('ComChainServerConf',to_push); 
            callback(true);
          } catch(e){
            callback(false);  
          }  
        } else {  
           callback(false);
        }  
      }  
    }; 
    xhr.send();
};

///
// [High level] Get the individual configuration
///

 
lsc3l_customisation.isApp = function(){
     return document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
}

lsc3l_customisation.getEndpointAddress = function(){
    try{
        return localStorage.getItem('ComChainAPI');
    } catch(e){
        return '';
    }
}

lsc3l_customisation.getCurencyName = function(){
    return getServerConfig('name');  
}

lsc3l_customisation.getContract1 = function(){
    return getServerConfig('contract_1');  
}

lsc3l_customisation.getContract2 = function(){
    return getServerConfig('contract_2');  
}

lsc3l_customisation.getContract3 = function(){
    return getServerConfig('contract_3');  
}

lsc3l_customisation.getHelpUrl = function(){
    return getServerConfig('url_help');  
}

lsc3l_customisation.getCondUrl = function(){
    return getServerConfig('url_cond');  
}

lsc3l_customisation.getUnlockUrl = function(){
    return getServerConfig('url_unlock');  
}

lsc3l_customisation.getLang = function(){
    var lang = getServerConfig('url_unlock');  
    if (lang=="") {
        lang = conf_locale.server.lang;
    }
    return lang;
}


lsc3l_customisation.getCssUrl = function(){  
    try{
        return localStorage.getItem('ComChainRepo') + lsc3l_config.custoRepo + lsc3l_customisation.lsc3l_customisation() + '/css/etherwallet-master.min.css';
    } catch(e){
        return conf_locale.server.url_Css;
    }  
}

lsc3l_customisation.getCurrencyLogoUrl = function(currency_name){
   if (currency_name){
        try{
            return localStorage.getItem('ComChainRepo') + lsc3l_config.custoRepo + currency_name + '/images/lem.png';
        } catch(e){
            return '';
        } 
   }
}


lsc3l_customisation.hasNant = function(){
    return getServerConfigSwitch('nant', false); 
}

lsc3l_customisation.hasCM = function(){
    return getServerConfigSwitch('CM', false); 
}

lsc3l_customisation.hasAutor = function(){
    return getServerConfigSwitch('autor', false); 
}

lsc3l_customisation.hasDeleg = function(){
    return getServerConfigSwitch('deleg', false); 
}

lsc3l_customisation.hasPayRequest = function(){
    return getServerConfigSwitch('payReq', false); 
}

lsc3l_customisation.passwordAutocomplete = function(){
    var number = 10000;
    try{
        config =  JSON.parse(localStorage.getItem('ComChainServerConf')).server;
        if (config.passwordAutocomplete && config.passwordAutocomplete>0){
            number = config.passwordAutocomplete;
        }
    } catch(e){
        
    } 
    return number;
}



////////////////////////////////////////////////////////////////////////////////
var checkRepo = function(repoList, callback){
    if (!repoList || repoList.length==0){
        callback(false);
    } else {
         var id = Math.floor((Math.random() * repoList.length));
         var repo = repoList[id];
         var xhr = new XMLHttpRequest();
         xhr.open('GET',repo + lsc3l_config.ping, true); 
         xhr.responseType = 'json';
         xhr.timeout = 3000;
         xhr.onreadystatechange = function (oEvent) {  
           if (xhr.readyState === 4) {  
             if (xhr.status === 200) { 
                    localStorage.setItem('ComChainRepo', repo);
                    callback(true);
             } else {  
                 repoList.splice(id,1);
                 checkRepo(repoList, callback); 
            }  
          }  
       }; 

    xhr.send();
    }
}


var testApi = function(api_address, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', api_address + '/api.php', true); 
    xhr.responseType = 'json';
    xhr.timeout = 5000;
    xhr.onreadystatechange = function (oEvent) {  
    if (xhr.readyState === 4) {  
        if (xhr.status === 200) { 
          try{
              var answer = xhr.response;
              if(typeof answer =='object'){
                        answer = JSON.stringify(xhr.response);
               }  
               callback(answer && answer!="null" && !answer.error);
          } catch(e){
            callback(false);  
          }  
         
        } else {  
           callback(false);
        }  
        }  
    }; 
    xhr.send();
}

testDbApi = function(api_address, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', api_address + '/dbcheck.php', true); 
    xhr.timeout = 5000;
    xhr.onreadystatechange = function (oEvent) {  
    if (xhr.readyState === 4) {  
        if (xhr.status === 200 ) { 
          try{
            callback(xhr.response==='pong');
          } catch(e){
            callback(false);  
          }  
         
        } else {  
           callback(false);
        }  
        }  
    }; 
    xhr.send();
}

var getServerConfig = function(config_name) {
    try{
        return  JSON.parse(localStorage.getItem('ComChainServerConf')).server[config_name];
    } catch(e){
        return '';
    }
}

var getServerConfigSwitch = function(config_name, default_value) {
    try{
        return  JSON.parse(localStorage.getItem('ComChainServerConf')).server[item_name].toString().toLowerCase()=='true';
    } catch(e){
        return default_value; 
    }
}


////////////////////////////////////////////////////////////////////////////////

module.exports = {
    lsc3l_config: lsc3l_config,
    lsc3l_customisation: lsc3l_customisation
}
