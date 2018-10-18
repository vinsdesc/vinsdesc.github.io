/**
 * Created by claudio on 13/12/16.
 */
var $ps = (function ($ps) {
    console.log('coucou');
    $ps.parameters = $ps.parameters || {};

    function isMobile() {
        return navigator.userAgent.match(/Android|(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|bolt|cldc|compal|doris|elaine|fennec|gobrowser|hiptop|htc|huawei|iemobile|ip(hone|od|ad)|iris|kindle|lge |lumia|nokia|maemo|mib|midp|minimo|mmp|model-orange|netfront|nexus \d+|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|playbook|plucker|pocket|psp|qnx|semc-browser|series(4|6)0|Silk|skyfire|symb(ian|ianos|os)|teashark|teleca|treo|up\.(browser|link)|uzard|wap|windows (ce|phone)|xda|xiino/i) !== null;
    }

    /**
     * Used to distinguish tablets from smartphones. We use <a href="https://mydevice.io/devices/">this</a> website.
     * Tricky part: look in the CSS width column, not in the physical width column.
     * @returns {boolean}
     */
    function hasBigScreen() {
        var screenWidth = screen.height > screen.width ? screen.width : screen.height;
        return screenWidth > 504;
    }

    function getDeviceType() {
        if (isMobile()) {
            return hasBigScreen() ? 'TABLET' : 'PHONE';
        } else {
            return 'DESKTOP';
        }
    }

    $ps.parameters.initParameters = function initParameters(parameters) {
        parameters = parameters || {};

        parameters.version = window.localStorage && localStorage.getItem('ps_version') || new Date().getTime();

        parameters.desactivateHtml5 = parameters.desactivateHtml5 || false;

        if (parameters.publisherSpotParams) {
            parameters.publisherSpotIds = [];

            for (var i = parameters.publisherSpotParams.length; i--;) {
                parameters.publisherSpotIds.push(parameters.publisherSpotParams[i].publisherSpotId);
            }
        } else {
            parameters.adsIdx = 0;
            parameters.boxId = parameters.boxId || 'proxistore-' + parameters.publisherSpotId;
        }

        parameters.deviceType = getDeviceType();
    };

    return $ps;
}($ps || {}));


/**
 * Created by claudio on 16/11/16.
 */
var $ps = (function ($ps) {
    $ps.common = $ps.common || {};
    var x = 0;

    $ps.common.param = function param(a) {
        var s = [], prop;

        for (prop in a) {
            if (a.hasOwnProperty(prop)) {
                if (a[prop])
                    s.push(prop + '=' + a[prop]);
            }
        }
        return s.join("&");
    };

    function createAttribute(name, value) {
        var attribute = document.createAttribute(name);
        attribute.value = value;

        return attribute;
    }

    function getPixelCounterDiv(publisherSpotId, boxId) {
        var boxPosition = document.getElementById(boxId);
        var pixelCounterDiv = document.getElementById("ps-pixelCounter-" + publisherSpotId);

        if (pixelCounterDiv === null) {
            pixelCounterDiv = document.createElement("div");
            var pixelCounter_div_id = createAttribute("id", "ps-pixelCounter-" + publisherSpotId);
            pixelCounterDiv.setAttributeNode(pixelCounter_div_id);
            var pixelCounter_div_class = createAttribute("class", "ps-pixelCounter");
            pixelCounterDiv.setAttributeNode(pixelCounter_div_class);
            var pixelCounter_div_style = createAttribute("style", "display:none");
            pixelCounterDiv.setAttributeNode(pixelCounter_div_style);
            boxPosition.appendChild(pixelCounterDiv);
        }

        return pixelCounterDiv;
    }

    function addPixelCounterImg(pixelCounterDiv, pixelCounterImgUrl) {
        if (pixelCounterImgUrl.search('\\?') == -1) {
            pixelCounterImgUrl = pixelCounterImgUrl + '?ps_v=' + new Date().getTime();
        } else {
            pixelCounterImgUrl = pixelCounterImgUrl + '&ps_v=' + new Date().getTime();
        }

        var pixelCounter_img = document.createElement("img");
        var pixelCounter_img_src = createAttribute("src", pixelCounterImgUrl);
        pixelCounter_img.setAttributeNode(pixelCounter_img_src);
        pixelCounterDiv.appendChild(pixelCounter_img);
    }

    $ps.common.getCityName = function getCityName(lat, lng, callback) {
        var request = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=AIzaSyDIn8wAA-Qaj7-Oh_K04IOTpO6erB66Ruo';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', request, true);
        xhr.onload = function (e) {
            var cityName = '', res = JSON.parse(xhr.responseText);
            if(res.status == 'OK') {
                for (i = 0; i < res.results.length; i++) {
                    for (j = 0; j < res.results[i].types.length; j++) {
                        if (res.results[i].types[j] == 'locality') {
                            cityName = res.results[i].address_components[j].long_name;
                        }
                    }
                }
                callback(cityName);
            } else {
                callback(cityName);
            }
        };
        xhr.onerror = function (e) {
            callback('');
        };
        xhr.send();
    };

    $ps.common.jsonp = function jsonp(url, data, callback) {
        var ps = 'ps_' + new Date().getTime() + x,
            script = document.createElement('script'),
            head = document.getElementsByTagName('head')[0] || document.documentElement,
            done = false, separator = (url.indexOf('?') > 0) ? '&' : '?';

        x++;
        if (typeof data === 'function' && !callback) {
            callback = data;
            data = undefined;
        }

        window[ps] = function (data) {
            if (callback) {
                callback(data);
            }
        };

        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                done = true;
                script.onload = script.onreadystatechange = null;
                if (head && script.parentNode) {
                    head.removeChild(script);
                }
            }
        };

        if (data) {
            if (typeof data !== 'string')
                data = $ps.common.param(data);
            url += '?' + data;
        }

        if (callback) {
            if (data) {
                separator = '&';
            }
            url += separator + 'callback=' + ps;
        }
        script.src = url;
        head.insertBefore(script, head.firstChild);
    };

    $ps.common.unserialize = function unserialize(data) {
        var object = [],
            pairs = data.split(/&/g);
        for (var i = pairs.length; i--;) {
            if (pairs[i].indexOf("+") > -1) {
                object[decodeURIComponent(pairs[i].substring(0, pairs[i].indexOf("+")))] = decodeURIComponent(pairs[i].substring(pairs[i].indexOf("+") + 1));
            }
        }
        return object;
    };

    $ps.common.recordstat = function recordstat(data) {
        // TODO
    };

    // Don't remove $ps.getScript : used in old passback easyXDM
    $ps.common.getScript = $ps.getScript = function getScript(source, callback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement,
            script = document.createElement("script");

        script.async = true;
        script.src = source;

        if (callback && script.addEventListener) {
            script.addEventListener("load", function () {
                callback();
            });
        }
        head.insertBefore(script, head.firstChild);
    };

    $ps.common.addPixelCounter = function addPixelCounter(publisherSpotId, boxId, pixelCounterImgUrls) {
        var pixelCounterDiv = getPixelCounterDiv(publisherSpotId, boxId);

        if (pixelCounterImgUrls.constructor !== Array) {
            addPixelCounterImg(pixelCounterDiv, pixelCounterImgUrls);
        } else {
            for (var i = pixelCounterImgUrls.length; i--;) {
                addPixelCounterImg(pixelCounterDiv, pixelCounterImgUrls[i]);
            }
        }
    };

    return $ps;
}($ps || {}));


/**
 * Created by claudio on 16/11/16.
 */
var $ps = (function ($ps) {
    $ps.geo = $ps.geo || {};

    // TODO - call cookie-v3
    $ps.geo.getPos = function getPos(publisherSpotId, url, deviceType, callback) {
        // Read the geolocation cookie
        $ps.common.jsonp(url + 'cookie/read', function (cookie) {
            if (cookie.value && (typeof callback === 'function')) {
                var cookieValue = $ps.common.unserialize(cookie.value);
                var geoType = cookieValue.GT;
                var latitude = cookieValue.CO.split("*")[0];
                var longitude = cookieValue.CO.split("*")[1];
                callback.call(this, latitude, longitude, geoType);
            }

        });
    };

    function isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
    }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    function isSafariMobile() {
        return isSafari() && isIOS();
    }

    // TODO - call cookie-v3
    $ps.geo.html5GeoLocation = function(url, deviceType, disableHtml5GeoLocation) {

        if (isSafariMobile() || disableHtml5GeoLocation || !navigator || !navigator.geolocation) return;

        function browserGeolocationSuccess(position) {
            if (isNaN(position.coords.latitude) || isNaN(position.coords.longitude)) {
                return;
            }
            var html5CookieCreationUrl = url + 'cookie/create?coord=' + position.coords.latitude + '*' + position.coords.longitude + '&geoType=HTML5&accuracy=' + position.coords.accuracy;
            $ps.common.jsonp(html5CookieCreationUrl, function(cookie) {} );
        }
        function browserGeolocationFail(error) {
            //console.error("Geolocation failure", error)
        }
        function browserGeolocatioOptions() {
            return { maximumAge:  10 * 60 * 1000, enableHighAccuracy : false };
        }

        // TODO check if we already have an HTML5 cookie
        console.log("CURRENT POSTION")
        navigator.geolocation.getCurrentPosition(
            browserGeolocationSuccess,
            browserGeolocationFail,
            browserGeolocatioOptions()
        );

    };


    return $ps;

}($ps || {}));


/**
 * Created by claudio on 16/11/16.
 */
var $ps = (function ($ps) {
    function manageCapping(publisherSpotId, spotCapping, drawTime) {
        var $ps_capping = JSON.parse(localStorage.getItem('ps_capping_' + publisherSpotId)) || {
            "frequency": "HOUR",
            "view": 2,
            "expires": 0
        };

        if (spotCapping && ($ps_capping.expires <= drawTime.getTime() ||
                $ps_capping.view != spotCapping.view ||
                $ps_capping.frequency != spotCapping.frequency)) {
            var spotCappingExpires = drawTime;

            switch (spotCapping.frequency) {
                case "HOUR":
                    spotCappingExpires.setTime(drawTime.getTime() + (60 * 60 * 1000));
                    break;
                case "DAY":
                    spotCappingExpires.setTime(drawTime.getTime() + (24 * 60 * 60 * 1000));
                    break;
                case "MINUTE":
                    spotCappingExpires.setTime(drawTime.getTime() + (60 * 1000));
                    break;
            }

            $ps_capping = {
                "frequency": spotCapping.frequency,
                "view": spotCapping.view,
                "expires": spotCappingExpires.getTime()
            };
            localStorage.setItem('ps_capping_' + publisherSpotId, JSON.stringify($ps_capping));
            localStorage.setItem('ps_exposure_' + publisherSpotId, 0);
        }
    }

    function isExposureAvailable(parametersArray, drawTime) {
        var exposureAvailable = false;

        for (var i = parametersArray.length; i--;) {
            var parameters = parametersArray[i];
            var $ps_capping = JSON.parse(localStorage.getItem('ps_capping_' + parameters.publisherSpotId)) || {
                "frequency": "HOUR",
                "view": 2,
                "expires": 0
            };
            var $ps_exposure = $ps.exposure || JSON.parse(localStorage.getItem('ps_exposure_' + parameters.publisherSpotId)) || 0;

            if ($ps_capping.expires <= drawTime.getTime() || $ps_exposure <= $ps_capping.view) {
                exposureAvailable = true;
                break;
            }
        }

        return exposureAvailable;
    }

    function manageDrawResults(drawResults, drawTime) {
        for (var i = drawResults.length; i--;) {
            if (!drawResults[i].hours) {
                localStorage.removeItem('ps_ads_' + drawResults[i].publisherSpotReferenceId);
            } else {
                localStorage.setItem('ps_ads_' + drawResults[i].publisherSpotReferenceId, JSON.stringify(drawResults[i].hours));
            }
            localStorage.setItem('ps_cpm_' + drawResults[i].publisherSpotReferenceId, drawResults[i].pricePerViews);
            manageCapping(drawResults[i].publisherSpotReferenceId, drawResults[i].capping, drawTime);
        }
    }

    function manageCallback(drawResults, drawTime, cb) {
        var currentDate = new Date();
        for (var i = drawResults.length; i--;) {
            localStorage.setItem('ps_cpm_' + drawResults[i].publisherSpotReferenceId, drawResults[i].pricePerViews);
            manageCapping(drawResults[i].publisherSpotReferenceId, drawResults[i].capping, drawTime);
            var exposure = localStorage.getItem('ps_exposure_' + drawResults[i].publisherSpotReferenceId);
            if (drawResults[i].hours) {
                if (exposure < drawResults[i].capping.view) {
                    var adsDateIndex = currentDate.getFullYear().toString() + (currentDate.getMonth() < 9 ? '0' + (currentDate.getMonth() + 1).toString() : (currentDate.getMonth() + 1).toString()) + (currentDate.getDate() < 10 ? '0' + currentDate.getDate() : currentDate.getDate().toString());
                    var ads_now = drawResults[i].hours && adsDateIndex in drawResults[i].hours && drawResults[i].hours[adsDateIndex].indexOf(currentDate.getHours()) >= 0;
                    if (ads_now) {
                        cb();
                    }
                }

            }
        }
    }

    $ps.start = function start(parameters) {
        var drawTime = new Date();
        $ps.parameters.initParameters(parameters);
        if (parameters.publisherSpotIds && parameters.baseUrl && isExposureAvailable(parameters.publisherSpotParams, drawTime)) {
            $ps.common.jsonp(parameters.baseUrl + parameters.langCtx + 'cookie/uv?id=' + parameters.publisherSpotParams[0].publisherSpotId, function (uvCookie) {
                $ps.geo.getPos(parameters.publisherSpotParams[0].publisherSpotId, parameters.baseUrl + parameters.langCtx, parameters.deviceType,
                    function (lat, lng, gt) {
                        if (Math.abs(lat) > 0.001 && Math.abs(lng) > 0.001) {
                            $ps.common.jsonp(parameters.baseUrl + parameters.langCtx + "tags/publisher-spot-one-week", {
                                publisherSpotReferenceIds: parameters.publisherSpotIds,
                                latitude: lat,
                                longitude: lng,
                                device: parameters.deviceType,
                                badIp: (gt === 'BADIP' || gt === 'IP_MOBILE' || gt === 'DISQUALIFIED') ? 'true' : 'false',
                                uniqueVisitorId: uvCookie.ui
                            }, function (results) {
                                if (localStorage) {
                                    localStorage.setItem('ps_version', '2');
                                    if (parameters.cb) {
                                        manageCallback(results, drawTime, parameters.cb);
                                    }
                                    else {
                                        manageDrawResults(results, drawTime);
                                    }
                                }
                            });
                        }
                        if (gt !== "HTML5") {
                            $ps.geo.html5GeoLocation(parameters.baseUrl + parameters.langCtx, parameters.deviceType, parameters.desactivateHtml5);
                        }
                    });
            });
        }
    };

    return $ps;

}($ps || {}));
