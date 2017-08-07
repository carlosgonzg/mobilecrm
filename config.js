var config = {
	development : {
		APP_PORT : process.env.PORT || 8081,
		//DB_URL: 'localhost:27017/heroku_cqkmxzc1',
		DB_URL: 'localhost:27017/heroku_cqkmxzc2',
		SERVER_URL: 'http://localhost:8080',
		MAIL_USR: 'info@mobileonecontainers.com',
		MAIL_PASS: '*info1234',
		PUBLIC_PATH: 'public/app'
	},
	production : {
		APP_PORT : process.env.PORT || 80,
		DB_URL: 'mmini:MobileMini2017@ds139023-a0.mlab.com:39023/heroku_74tjnnf6',
		DB_USER: 'mmini',
		DB_PASS: 'MobileMini2017',
		SERVER_URL: 'https://mobileonecrm.herokuapp.com',
		MAIL_USR: 'info@mobileonecontainers.com',
		MAIL_PASS: '*info1234',
		PUBLIC_PATH: 'public/app'
	}
};

var mode;
function getEnv() {
	var mde = mode || 'development';
	return config[mde];
}
function init(app) {
	mode = app.get('env');
	return config[mode];
}
exports.getEnv = getEnv;
exports.init = init;
