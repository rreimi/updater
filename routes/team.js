var express = require('express');
var request = require('request');
var teamModel = require('../models/team');
var db = require('../lib/db');
var async = require('async');
var Promise = require('bluebird');
var router = express.Router();

var apiQB = {};

apiQB.urls = [];

apiQB.urls['base'] = 'http://api.qualitysports.com.ve/api/';
apiQB.urls['teams'] = 'equipo' ;
apiQB.accessToken = '45eadc85b650776e48bdf666120d0fbc';

var request = request.defaults({
    baseUrl: apiQB.urls['base'],
    method: 'GET'
});

apiQB.getUrl = function(urlName, params) {
    var url = apiQB.urls[urlName] + '?access_token=' + apiQB.accessToken;
    for (var key in params) {
        url += '&'+key+'='+params[key];
    }
    return url;
};

apiQB.getTeam = function(idTeam, callback) {
    var url = apiQB.getUrl('teams', { 'id_equipo': idTeam });
    request(url, function(error, response, body) {
        //console.log(response.statusCode);
        //TODO handle 500, 401, 403 etc
        if (response.statusCode != 200) {
            //console.log(body);
            //TODO return error
            callback('error', null);
        } else {
            var teamData = JSON.parse(body);
            if (!teamData.data){
                throw new Error('no data for team');
            } else {
                callback(null, teamData.data.rows);
            }
        }
    });
};

router.get('/tibu', function(req, res, next) {
    db.query("select * from team where id = 1", function(err, rows, fields){
        res.json(rows);
    })
});

/* GET teams listing. (callback hell sample) */
router.get('/', function(req, res, next) {
    var teams = [];

    //Team 1
    apiQB.getTeam(1, function(error, team){
        teams.push(team);
        //Team 2
        apiQB.getTeam(2, function(error, team){
            teams.push(team);
            //Team 3
            apiQB.getTeam(3, function(error, team){
                teams.push(team);
                //Team 4
                apiQB.getTeam(4, function(error, team){
                    teams.push(team);
                    //Team 5
                    apiQB.getTeam(5, function(error, team){
                        teams.push(team);
                        //Team 6
                        apiQB.getTeam(6, function(error, team){
                            teams.push(team);
                            //Team 7
                            apiQB.getTeam(7, function(error, team){
                                teams.push(team);
                                //Team 8
                                apiQB.getTeam(8, function(error, team){
                                    teams.push(team);
                                    //After loading 8 teams, callback
                                    teamModel.updateTeams(teams);
                                    res.json(teams);
                                });
                            });
                        });
                    });

                });
            });
        });
    });
});

/* GET teams listing. (simplified callback hell) */
router.get('/callback2', function(req, res, next) {
    var teams = [];
    var done = false;
    var callbackCount = 0;
    for (var i = 1; i < 9; i++){
        apiQB.getTeam(i, function(error, team) {
            teams.push(team);
            callbackCount++;
            if (callbackCount == 8) {
                teamModel.updateTeams(teams);
                res.json(teams);
                done = true;
            }
        });
    }
});

/* GET teams listing. (using async) */
router.get('/async1', function(req, res, next) {
    var teams = [];
    var idTeams = [1,2,3,4,5,6,7,8];

    //Parallel calls, for each team id call the api
    async.each(idTeams, function(id, callback) {
        apiQB.getTeam(id, function(error, team) {
            //TODO handle error
            teams.push(team);
            callback(); //callback is required in order to let each no this iteration is finished
        })
    }, function(err){ //this function is called when all the previous call are completed
        if( err ) {
            console.log('A file failed to process');
        } else {
            console.log(teams);
        }
        res.json(teams);
    });
});

/* GET teams listing. (using async) */
router.get('/async2', function(req, res, next) {
    var teams = [];
    var idTeams = [1,2,3,4,5,6,7,8];

    //Sequential calls, for each team id call the api
    async.eachSeries(idTeams, function(id, callback) {
        apiQB.getTeam(id, function(error, team) {
            //TODO handle error
            teams.push(team);
            callback(); //callback is required in order to let each no this iteration is finished
        })
    }, function(err){ //this function is called when all the previous call are completed
        if( err ) {
            console.log('A file failed to process');
        } else {
            console.log(teams);
        }
        res.json(teams);
    });
});

/** Promises **/

/* GET teams listing. (using async) */
router.get('/asyncWithNumbers', function(req, res, next) {
    var teams = [];
    var idTeams = [1,2,3,4,5,6,7,8];

    async.each(idTeams, function(id, callback) {
        async.setImmediate(function () {
            callback(null, teams.push(id));
        });
    }, function(err){
        if( err ) {
            console.log('A file failed to process');
        } else {
            console.log(teams);
        }
        res.send("done");
    });
});


//var options = {};
//
//var current = Promise.resolve();
//var idTeams = [1,2,3,4,5,6,7,8];
//
//apiQB.getTeamAsync(id).then(function(a,b){
//    console.log(a);
//    console.log(b);
//})
Promise.promisifyAll(apiQB);

router.get('/promises1', function(req, res, next) {
    var id = 1;
    apiQB.getTeamAsync(id).then(function(a){
        res.json(a);
    });
});

router.get('/promises2', function(req, res, next) {
    Promise.resolve().then(function() {
        //Get 3 teams
        return [apiQB.getTeamAsync(1), apiQB.getTeamAsync(2), apiQB.getTeamAsync(10000)] ;
    }).spread(function(team1, team2, team3) {
        //Combine in one array
        var teams = [];
        teams.push(team1);
        teams.push(team2);
        teams.push(team3);
        return teams;
    }).then(function(val){
        //Print in the response
        res.json(val);
    }).catch(TypeError, function(err) {
        err.forEach(function(e) {
            console.error(e.stack);
        });
    }).catch(Error, function(err) {
        err.forEach(function(e) {
            console.error(e.stack);
        });
    });
});

router.get('/promises3', function(req, res, next) {
    var teams = [];
    for (var i = 1; i < 9; ++i) {
        teams.push(apiQB.getTeamAsync(i));
    }

    //Se pasa... xD
    Promise.all(teams).then(function(result) {
        res.send(result);
    });
});

module.exports = router;
