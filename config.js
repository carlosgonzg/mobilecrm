var config = {
	development : {
		APP_PORT : process.env.PORT || 8080,
		DB_URL: 'localhost:27017/mobilecrm',
		SERVER_URL: 'http://localhost:8080',
		MAIL_USR: 'info@mobileonecontainers.com',
		MAIL_PASS: 'ElMundoGira2012!',
		PUBLIC_PATH: 'public/app'
	},
	production : {
		APP_PORT : process.env.PORT || 80,
		DB_URL: 'inspector:Elo27071989@ds161315.mlab.com:61315/heroku_cqkmxzc1',
		DB_USER: 'inspector',
		DB_PASS: 'Elo27071989',
		SERVER_URL: 'https://mobileonecrm.herokuapp.com',
		MAIL_USR: 'info@mobileonecontainers.com',
		MAIL_PASS: 'ElMundoGira2012!',
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
