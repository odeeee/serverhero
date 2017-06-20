//postresql
//heroku.com/postgres
//heroku.com/pricing 

var fs = require('fs');
var mysql = require('mysql');

var data = fs.readFileSync('naytot.json');
var naytot = JSON.parse(data);

var express = require('express');
var app =express();

//app.use(express.static(__dirname + '/public'));

var path = require('path'); //Use the path to tell where find the .ejs files
// view engine setup
app.set('views', path.join(__dirname, '/views')); // here the .ejs files is in views folders
app.set('view engine', 'ejs'); //tell the template engine

//var router = express.Router();


app.get('/', function(req, res){
res.sendFile(__dirname + '/public/default.html');
res.send('Hi');
console.log('page loaded');
});

var port = process.env.PORT || 8000;

app.listen(port , function(){
	console.log('server listening');
});

var connection = mysql.createConnection({
  connectionLimit : 100,
  host     : 'www.db4free.net',
  port     :  3306,
  user     : 'porkkana',
  password : 'orava1337',
  database : 'ovensausage'
});

/*
    var sql = "CREATE TABLE vstable2 (Ryhma VARCHAR(255) PRIMARY KEY, Viesti TEXT)";
  	connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");

    var sql = "INSERT INTO vstable2 (Ryhma, Viesti) VALUES ('TVT15SPO', 'default')";
  	connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
  	}); 
*/
connection.connect(function(err) {
  if(err){
    console.log('Error connecting to Db ' + err.stack);

    return;
  }else{
   console.log('Connection established');
   databTulostus();
	}
});

//Yllä pitää yhteyttä
setInterval(function () {
    connection.query('SELECT 1');
}, 5000);

function databTulostus(){
connection.query('SELECT * from vstable2', function(err, rows, fields) {
  if (!err)
    console.log('The solution is: ', rows);
  else
    console.log('Error while performing Query. ');
});

connection.query('SELECT * from ostable', function(err, rows, fields) {
  if (!err)
    console.log('\n\n\nThe solution is: ', rows);
  else
    console.log('Error while performing Query. ');
});
}
//connection.end();

app.get('/info', sendStuff);

function sendStuff(request , response) {
	response.send(naytot);
	console.log('sendStuff loaded');
}

app.get('/add/1/:beacon/:ryhma/:saa', addInfo);

function addInfo(request , response){
		console.log('addInfo')
	var data = request.params;
	var beacon1 = data.beacon;
	var beacon = beacon1.toString();
	var ryhma = data.ryhma;
	var saa = data.saa;

	naytot[beacon] = ryhma;

	var viesti = " ";

	connection.query('SELECT Viesti FROM ostable Where Major = ?', [beacon] , function (err, result) {
    if (err) {
    	throw err;
    }else{
    	console.log("Viesti haettu " + result[0].Viesti);
    	setViesti(result);
	}
  	});

  	function setViesti(result) {
  	viesti = result[0].Viesti;
  	console.log("viesti: " + viesti);
  	updateDb();
	}

	function updateDb(){
	var post  = {Major: beacon, Ryhma: ryhma, Saa: saa,Viesti: viesti };
  	connection.query('UPDATE ostable SET ? Where Major = ?', [post , beacon] , function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
    databTulostus();
  	});

	var tieto = JSON.stringify(naytot , null ,2);
	fs.writeFile('naytot.json' , tieto , finished);

	function finished(err){
		console.log('all set');
	
	var reply = {
		beacon: beacon,
		ryhma: ryhma,
		saa: saa,
		status:"all done"
	}
	response.send(reply);
	}
}
}

app.get('/add/2/:beacon/:ryhma/:saa/:viesti', addInfoV);

function addInfoV(request , response){
	console.log('addInfoV');
	var data = request.params;
	var beacon1 = data.beacon;
	var beacon = beacon1.toString();
	var ryhma = data.ryhma;
	var saa = data.saa;
	var viesti = data.viesti;

	naytot[beacon] = ryhma;

	var ryhm = {Ryhma: ryhma};
	var viest  = {Ryhma: ryhma ,Viesti: viesti};

	connection.query('INSERT INTO vstable2 SET ? ON DUPLICATE KEY UPDATE Viesti = ? ', [viest, viesti] , function (err, result) {
    if (err) throw err;
    console.log("viesti record inserted");
  	});

	var post  = {Major: beacon, Ryhma: ryhma, Saa: saa,Viesti: viesti};

  	connection.query('UPDATE ostable SET ? Where Major = ?', [post , beacon] , function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
    databTulostus();
  	});

	var tieto = JSON.stringify(naytot , null ,2);
	fs.writeFile('naytot.json' , tieto , finished);

	function finished(err){
		console.log('all set');
	
	var reply = {
		beacon: beacon,
		ryhma: ryhma,
		saa: saa,
		viesti: viesti,
		status:"all done"
	}

	response.send(reply);
	}
}

app.get('/beacon/:major', openSite);

function openSite(request , response){
	console.log('openSite');
	var data = request.params;
	var key = data.major;
	var saa = " ";
	var ryhma = "null";
	var viesti = " ";

	//var ryhmaTunnus = getValues(naytot,key);
	//console.log(ryhmaTunnus);
	
	connection.query('SELECT * FROM ostable Where Major = ?', [key] , function (err, result) {
    	if (err) {
    		throw err;
    	}else{
    		console.log("Data haettu " + result[0]);
    		seTup(result);
		}
  	});
	
  	function seTup(result){
  		saa = result[0].Saa;
  		ryhma = result[0].Ryhma;
  		console.log("Saa , Ryhma: " + saa + " " + ryhma);
  		haeViesti(ryhma);
  	}

  	function haeViesti(ryhma){
  		console.log(ryhma)
  		connection.query('SELECT * FROM ostable Where Ryhma = ?', [ryhma] , function (err, result) {
    		if (err) {
    			throw err;
    		}else{
    			console.log("Viesti haettu " + result[0].Viesti);
    			seTupViesti(result);
			}
  		});	
  	}

  	function seTupViesti(result){
  		viesti = result[0].Viesti;
  		console.log("viesti: " + viesti);
  		vastaa();
  	}

  	function vastaa(){
	if (ryhma != "null") {
		//response.sendFile(__dirname + '/public/default.html');
		response.render("index", { 
			ryhma: ryhma,
			saa: saa,
			viesti: viesti});
		console.log("Vastattu");
		
	}else{
		console.log("ryhma null");
		response.sendFile(__dirname + '/public/default.html');
	}
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
