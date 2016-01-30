var unirest = require('unirest');
var fs = require('fs');
var Q = require('q');


console.log('Trying to analyze P2 Lunch');

getWebPage('http://restaurangp2.se/lunch').then(function(data) {
    try {
        var allLunches = parseP2Lunch(data);

        console.log('Parsing finished:');
        console.log(allLunches);

        outputLunches('results/p2.json', allLunches);

    } catch (exception) {
        console.error('Exception: ' + exception);
    }

}, function() {
    console.warn('Could not get p2 lunch web page!');
});

function getWebPage(url) {
    console.log('Reading web page: ' + url);

    var deferred = Q.defer();

    var webPage = fs.readFileSync('p2page.html', {
        encoding: 'utf-8'
    });

    deferred.resolve(webPage);
    // unirest.get(url)
    //     .end(function(res) {
    //         try {
    //             var body = res.body;

    //             deferred.resolve(body);
    //             console.log("Response received for: " + url);

    //         } catch (exception) {
    //             console.log('Request failed!');
    //             deferred.reject('Failed with request');
    //         }
    //     });
    return deferred.promise;
}

function parseP2Lunch(webPage) {
    console.log('Parsing P2 lunch...');

    var mainContent = getMainContent(webPage);

    var days = [];

    var dayRegex = /<div id=\"(.*?)\"(?:.|[\r\n])*?<table>((?:.|[\r\n])*?)<\/table>/gi
    var answer;
    while (answer = dayRegex.exec(webPage)) {
        var dayName = answer[1];
        var lunchContent = answer[2];
        var dayLunches = parseLunches(lunchContent);
        days.push({
            day: dayName,
            lunches: dayLunches
        });
    }
    return days;
}

function parseLunches(content) {
    var lunchRegex = /<tr>((?:.|[\r\n])*?)<\/tr>/gi

    var lunches = [];
    var answer;
    while (answer = lunchRegex.exec(content)) {
        var lunchText = answer[1];
        var lunch = parseLunch(lunchText);
        if (lunch)
            lunches.push(lunch);
    }
    return lunches;
}

function getCellValue(content, className) {
    var regex = new RegExp('<td class="' + className + '">(?:.|[\r\n])*?<p>((?:.|[\r\n])*?)<\/p>(?:.|[\r\n])*?<\/td>', 'i');

    var answer = regex.exec(content);
    if (answer && answer.length > 0) {
        return answer[1];
    }
}

function parseLunch(content) {
    var price = getCellValue(content, 'course_price');
    var description = getCellValue(content, 'course_description');
    var type = getCellValue(content, 'course_type');

    if (price) { //There is no such thing as a free lunch.
        var lunch = {
            price: price,
            description: description,
            type: type
        };
        console.log('lunch: ' + JSON.stringify(lunch));
        return lunch;

    }
}

function outputLunches(targetFileName, lunches) {
    console.log('Writing data to file "'+targetFileName+'"');
    fs.writeFileSync(targetFileName, JSON.stringify(lunches), {
        encoding: 'utf-8'
    });
    console.log('File succcessfully written!');

}

function getMainContent(webPage) {
    var mainContentRegex = /<section class="main_content_menu((?:.|[\r\n])*?)<\/section>/i;

    var answer;
    if (answer = mainContentRegex.exec(webPage)) {
        return answer[1];
    } else {
        console.log('Unable to find P2 Main Content');
    }
}
