const mysql = require('mysql');

var con = mysql.createPool({
    host: process.env.PROD_HOST,
    user: process.env.PROD_USER,
    password: process.env.PROD_PASS,
    database: process.env.PROD_DB_NAME
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