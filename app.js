var fs = require('fs');

var data = fs.readFileSync('naytot.json');
var naytot = JSON.parse(data);

var express = require('express');
var app =express();
//app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
//res.sendFile(__dirname + '/public/index.html');
res.send('Hi');
console.log('page loaded');
});

var port = process.env.PORT || 8000;

app.listen(port , function(){
	console.log('server listening');
});

app.get('/info', sendStuff);

function sendStuff(request , response) {
	response.send(naytot);
	console.log('sendStuff loaded');
}

app.get('/add/:beacon/:ryhma', addInfo);

function addInfo(request , response){
		console.log('ADDINFO')
	var data = request.params;
	var beacon = data.beacon;
	var ryhma = data.ryhma;

	naytot[beacon] = ryhma;

	var tieto = JSON.stringify(naytot , null ,2);
	fs.writeFile('naytot.json' , tieto , finished);

	function finished(err){
		console.log('all set');
	
	var reply = {

		beacon: beacon,
		ryhma: ryhma,
		status:"all done"
	}

	response.send(reply);
	}
}
