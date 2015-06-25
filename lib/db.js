//#db.js
var mysql = require('mysql');

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
    user     : 'root',
    password : 'admin',
    database : 'fantasy',
    debug    :  false
});

function query(query, callback) {
    pool.getConnection(function(err, conn){
        if (err) {
            conn.release();
            callback(err);
        } else {
            conn.query(query, function(err, rows, fields) {
                conn.release();
                if (err) throw err;
                callback(err, rows, fields);
            });
        }
    });
}

var db = {}
db.query = query;

module.exports = db;