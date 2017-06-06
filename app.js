var fs = require('fs');

var data = fs.readFileSync('naytot.json');
var naytot = JSON.parse(data);

var express = require('express');
var app =express();

//app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
//res.sendFile(__dirname + '/public/index.html');
res.send('Hi2');
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

app.get('/beacon/:major', openSite);

function openSite(request , response){
	console.log('openSite');
	var data = request.params;
	var key = data.major;

	var ryhmaTunnus = getValues(naytot,key);
	console.log(ryhmaTunnus);


	if (ryhmaTunnus != null) {
		response.send(ryhmaTunnus);
	}else{
		response.send("default");
	}

	function getValues(obj, key) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getValues(obj[i], key));
        } else if (i == key) {
            objects.push(obj[i]);
        }
    }
    return objects;
	}
	
}
}