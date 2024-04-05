const http = require('http'),
	fs = require('fs'),
	url = require('url');

// Create a server
http
	.createServer((req, res) => {
		let addr = req.url,
			q = new URL(addr, 'http://' + req.headers.host),
			filePath = '';

		fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
			if (err) {
				console.log(err);
			} else {
				console.log('Added to log.');
			}
		});

		if (q.pathname.includes('documentation')) {
			filePath = __dirname + '/documentation.html';
		} else {
			filePath = 'index.html';
		}

		fs.readFile(filePath, (err, data) => {
			if (err) {
				throw err;
			}

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(data);
			res.end();
		});
	})
	.listen(8080);

console.log('My Node test server is running on Port 8080.');
