require('dotenv').config()
const http = require('http')

http.createServer(function(req, res) {
  if (req.url == '/' && req.method == 'GET') {
    let date = "";
    let interval = setInterval(function() {
      date = new Date();
      console.log(date);
    }, process.env.INTERVAL_TIME)
  
    setTimeout(function() {
      clearInterval(interval);
      res.end(date.toString());
    }, process.env.TOTAL_TIME)
  }
}).listen(3000, function (err) {
  if (err) {
    return console.error(err);
  }
  console.log('Сервер запущен на порту 3000');
})