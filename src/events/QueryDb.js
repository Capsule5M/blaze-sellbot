const mysql = require('mysql');

var con = mysql.createPool({
    host: "127.0.0.1",
    user: "admin",
    password: "t3SqfX41FzpihSwETUZQ32qZAPO9djEw",
    database: "modern"
});

function QueryDb(sql, cb) {
    return new Promise((resolve, reject) => {
        con.getConnection(function (err, connection) {
            if (err) {
                console.log(err)
                reject(err);
                return;
            }
            connection.query(sql, function (err, result) {
                connection.release();
                if (err) {
                    console.log(err)
                    reject(err);
                    return;
                }
                cb(result);
                resolve();
            });
        });
    });
}

module.exports = QueryDb