var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

var goToPage = function goToPage(page, queryString) {
    /*var langTag = getUrlParameter('langTag');
    if (langTag == undefined || langTag == null || langTag == "") {
        langTag = 'en-us';
    }

    var pcEnvironment = getUrlParameter('environment');
    if (pcEnvironment == undefined || pcEnvironment == null || pcEnvironment == "") {
        pcEnvironment = getUrlParameter('pcEnvironment');
    }

    window.location = page + '.html?langTag=' + langTag + '&environment=' + pcEnvironment;*/

    var pageUrl = page + '.html?' + queryString;
    window.location = pageUrl;
}