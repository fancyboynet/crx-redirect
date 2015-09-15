(function(){
    'use strict';
    var data = [];
    var getRedirectUrl = function(url, reg, response){
        var result;
        if(response.indexOf('http:') !== -1){
            result = response;
        }
        else{
            result = url.replace(reg, response);
        }
        return result;
    };
    var parse = function(url){
        var result;
        data.every(function(el, index, array){
            if(!el.enable){
                return true;
            }
            el.map.every(function(el, index, array){
                if(!el.enable){
                    return true;
                }
                var reg = new RegExp(el.request, 'ig');
                if(reg.test(url)){
                    result = {
                        redirectUrl : getRedirectUrl(url, reg, el.response)
                    };
                    return false;
                }
                return true;
            });
        });
        return result;
    };
    chrome.webRequest.onBeforeRequest.addListener(function (details) {
            return parse(details.url);
        },
        {urls: ["<all_urls>"]},
        ["blocking"]
    );
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        data = request;
    });
})();