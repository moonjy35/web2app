/*jshint devel: true */
(function (exports) {
    "use strict";
    
    exports.web2app = (function () {

        var ua = daumtools.userAgent(),
            os = ua.os;
        
        var intentNotSupportedBrowserList = [
            'firefox'
        ];
        
        function moveToStore (storeURL) {
            window.location.href = storeURL;
        }

        function web2app (context) {
            var willInvokeApp = (typeof context.willInvokeApp === 'function') ? context.willInvokeApp : function(){},
                onAppMissing  = (typeof context.onAppMissing === 'function')  ? context.onAppMissing  : moveToStore,
                onUnsupportedEnvironment = (typeof context.onUnsupportedEnvironment === 'function') ? context.onUnsupportedEnvironment : function(){};
            
            willInvokeApp();

            if (os.android) {
                if (isIntentNotSupportedBrowser() || !!context.useUrlScheme) {
                    if (context.storeURL) {
                        web2appViaCustomUrlSchemeForAndroid(context.urlScheme, context.storeURL, onAppMissing);
                    }
                } else if (context.intentURI){
                    web2appViaIntentURI(context.intentURI);
                }
            } else if (os.ios && context.storeURL) {
                web2appViaCustomUrlSchemeForIOS(context.urlScheme, context.storeURL, onAppMissing);
            } else {
                setTimeout(function () {
                    onUnsupportedEnvironment();
                }, 100);
            }
        }
        
        function isIntentNotSupportedBrowser () {
            var blackListRegexp = new RegExp(intentNotSupportedBrowserList.join('|'), "i");
            return blackListRegexp.test(ua.ua);
        }

        function web2appViaCustomUrlSchemeForAndroid (urlScheme, storeURL, fallbackFunction) {
            var tid = deferFallback(function () {
                fallbackFunction(storeURL);
            });
            launchAppViaHiddenIframe(urlScheme);
        }

        function web2appViaIntentURI (launchURI) {
            setTimeout(function () {
                top.location.href = launchURI;
            }, 100);
        }

        function web2appViaCustomUrlSchemeForIOS (urlScheme, storeURL, fallbackFunction) {
            var tid = deferFallback(function () {
                fallbackFunction(storeURL);
            });
            document.addEventListener('visibilitychange', function clear () {
                if (isPageVisible()) {
                    clearTimeout(tid);
                    document.removeEventListener('visibilitychange', clear);
                }
            });
            launchAppViaHiddenIframe(urlScheme)
        }

        function isPageVisible () {
            var attrNames = ['hidden', 'webkitHidden'];
            for(var i=0, len=attrNames.length; i<len; i++) {
                if (document[attrNames[i]] !== 'undefined') {
                    return !document[attrNames[i]];
                }
            }
            return true;
        }

        function deferFallback (callback) {
            var clickedAt = new Date().getTime();
            return setTimeout(function () {
                var now = new Date().getTime();
                if (isPageVisible() && now - clickedAt < 1500) {
                    callback();
                }
            }, 1000);
        }

        function launchAppViaHiddenIframe (urlScheme) {
            setTimeout(function () {
                var iframe = createHiddenIframe('appLauncher');
                iframe.src = urlScheme;
            }, 100);
        }

        function createHiddenIframe (id) {
            var iframe = document.createElement('iframe');
            iframe.id = id;
            iframe.style.border = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.display = 'none';
            iframe.style.overflow = 'hidden';
            document.body.appendChild(iframe);
            return iframe;
        }

        /**
         * app.을 실행하거나 / store 페이지에 연결하여 준다.
         * @function 
         * @param context {object} urlScheme, intentURI, storeURL, appName, onAppMissing, onUnsupportedEnvironment, willInvokeApp 
         * @example daumtools.web2app({ urlScheme : 'daumapps://open', intentURI : '', storeURL: 'itms-app://...', appName: '다음앱' });
         */
        return web2app;
        
    })();
    
})(window.daumtools = (typeof window.daumtools === 'undefined') ? {} : window.daumtools);

    