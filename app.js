var fs = require('fs');
var mysql = require('mysql')
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

// Asetetaan portti jota kuunnellaan
var port = process.env.PORT || 8000;

app.listen(port , function(){
	console.log('Server listening');
  connDb();
});
//Alustetaan databaseyhteys
var connection = mysql.createConnection({
  connectionLimit : 100,
  host     : 'www.db4free.net',
  port     :  3306,
  user     : 'porkkana',
  password : 'orava1337',
  database : 'ovensausage'
});

//Yhdistää databaseen
function connDb(){
  console.log('Connecting to database...');
  connection.connect(function(err) {
    if(err){
      console.log('Error connecting to Db ' + err.stack);
      return;
    }else{
   	  console.log('Connection established');
   	  databTulostus();
    }
  });
}
//Yllä pitää yhteyttä Databaseen 
setInterval(function () {
  connection.query('SELECT 1');
}, 5000);
//Tulostaa taulukot vstable2 ja ostable
function databTulostus(){
	connection.query('SELECT * from vstable2', function(err, rows, fields) { //vstable2  sisältää ryhmatunnuksen joka on key sekä ryhman viestin
  		if (!err)
    		console.log('vstable2:  \nThe solution is: ', rows);
  		else
    		console.log('Error while performing Query. ');
	});

	connection.query('SELECT * from ostable', function(err, rows, fields) { //ostable sisältää rtunnuksen, beaconin major arvon, paikkakunnan säätietoja varten sekä viestin
  		if (!err)
    		console.log('\n\nostable: \nThe solution is: ', rows);
  		else
    		console.log('Error while performing Query. ');
	});
}

//Tällä haetaan arvoja key:llä JSON tiedostosta
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

app.get('/info', sendStuff);

function sendStuff(request , response) {
	response.send(naytot);
	console.log('sendStuff loaded');
}

//Url johon Android yhdistää jos ei samalla päivitä viestiä https://oven-sausage.herokuapp.com/add/1/BEACONIN_MAJOR/RYHMÄTUNNUS/KAUPUNKI
app.get('/add/1/:beacon/:ryhma/:saa', addInfo);

function addInfo(request , response){
	console.log('addInfo1')

  var data = request.params;
  var beacon1 = data.beacon;
  var ryhma = data.ryhma;
  var ryhmaTunnus = getValues(naytot,beacon1);
  console.log(ryhmaTunnus + " " + ryhma); 

  if (ryhmaTunnus != "null" && ryhma != "null") {
    console.log("add1: ryhmaTunnus beaconilla varattu");
  }else{
	  var beacon = beacon1.toString();
	  var saa = data.saa;
	  naytot[beacon] = ryhma;
	  var viesti = " ";
  
	  connection.query('SELECT Viesti FROM vstable2 Where Ryhma = ?', [ryhma] , function (err, result) {
      if (err) {
        console.err;
        viesti = "Ryhmälle ei ole viestiä";
        console.log('Ryhmällä ei viestiä');
        updateDb();
      }else{
        if(result!=""){
    	    console.log("Viesti haettu " + result[0].Viesti);
    	    setViesti(result);
        }else{
          console.log("Ei viestiä");
          viesti = " ";
          updateDb();
        }
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
    }

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

//Url johon Android yhdistää jos päivittää viestin samalla https://oven-sausage.herokuapp.com/add/2/BEACONIN_MAJOR/RYHMÄTUNNUS/KAUPUNKI/VIESTI
app.get('/add/2/:beacon/:ryhma/:saa/:viesti', addInfoV);

function addInfoV(request , response){
	console.log('addInfoV');
  var data = request.params;
  var beacon1 = data.beacon;
  var ryhma = data.ryhma;
  var ryhmaTunnus = getValues(naytot,beacon1);
  console.log(ryhmaTunnus + " " + ryhma); 

  if (ryhmaTunnus != "null" && ryhma != "null") {
    console.log("add2: ryhmaTunnus beaconilla varattu");
  }else{
	  var beacon = beacon1.toString();
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
}

app.get('/viesti/:ryhma/:msg/:user', tallennaViesti);

function tallennaViesti(request , response){
  console.log('tallennaViesti');
  var data = request.params;
  var ryhma = data.ryhma;
  var msg = data.msg;
  var user = data.user;
  var viest  = {Ryhma: ryhma ,Viesti: msg};

  connection.query('INSERT INTO vstable2 SET ? ON DUPLICATE KEY UPDATE Viesti = ? ', [viest, msg] , function (err, result) {
      if (err) throw err;
      console.log("viesti record inserted");
  });

  var reply = {
    user: user,
    ryhma: ryhma,
    viesti: msg,
    status:"all done"
  }
  response.send(reply);
}

var beaconStatus = {
  "beacon1":
    { "major":"32109",
      "ryhma":"DEF14ULT"
    },
  "beacon2":  
    { "major":"60020",
      "ryhma":"DEF14ULT"
    },
  "beacon3": 
    { "major":"18494",
      "ryhma":"DEF14ULT"
    }
}

function getRyhmaWithMajor(major) {
  return data.filter(
    function(data) {
      return data.major == major
    }
  );
}

function getRyhma(beaconStatus, major){

  for(var x in beaconStatus){
    if(beaconStatus[x].major && beaconStatus[x].major.split(",").indexOf(major.toString())!=-1) return beaconStatus[x].ryhma;
  }
  
  return "Not Found";
  
}

app.get('/beacon/:major', openSite);

function openSite(request , response){
	console.log('openSite');

  var data = request.params;
	var key = data.major;
	var saa = " ";
	var ryhma = "null";
	var viesti = " ";
  var keli = 0;
  var iconId = " ";
  var ruoka;

  //Haetaan Beaconin edellisen päivityksen ryhmä 
  var ryhmaSta = getRyhma(beaconStatus , key);   //https://stackoverflow.com/questions/34450904/how-to-find-value-in-json?noredirect=1&lq=1

	console.log(ryhmaSta);
  //Haetaan Beaconin major arvolla tiedot.
	connection.query('SELECT * FROM ostable Where Major = ?', [key] , function (err, result) {
    	if (err) {
    		throw err;
    	}else{
    		console.log("Data haettu " + result[0]);
        //testataan onko Beaconin ryhmä vaihtunut viimekerrasta
        ryhma = result[0].Ryhma;
        if(ryhma != "null"){
          seTup(result);
          /*if(ryhma != ryhmaSta){
            //Beaconin ryhmä arvo vaihtunut päivitetään tiedot 
    		    seTup(result);
          }else{
            //Beaconin ryhmä sama päivitetään sivu samoilla arvoilla kuin viimeksi
            vastaa();*/
          }
        }else{
          //Beaconstatus null asetetaan se Beaconin ryhmä arvoksi
          if(key == 32109){
            beaconStatus.beacon1.ryhma = "null";
          }
          if(key == 60020){
            beaconStatus.beacon2.ryhma = "null";
          }
          if(key == 18494){
            beaconStatus.beacon3.ryhma = "null";
          }
          //Avataan default sivu
          sendDef();  
        }
		  }
  });
	//Avaa default sivun joka esillä kun Beaconilla ei ryhmän arvoa
  function sendDef(){
    console.log("Ryhma null avataan default sivu Beaconissa: " + key);
    response.sendFile(__dirname + '/public/default.html');
  }

  function seTup(result){
  	saa = result[0].Saa;
  	ryhma = result[0].Ryhma;
  	console.log("Saa , Ryhma: " + saa + " " + ryhma);
  	haeViesti(ryhma);
  }
  //Haetaan ryhmän viesti databasesta
  function haeViesti(ryhma){
  	connection.query('SELECT * FROM vstable2 Where Ryhma = ?', [ryhma] , function (err, result) {
    	if (err) {
    		throw err;
    	}else{
  			console.log("Viesti haettu ryhmälle: "+ ryhma + " Viesti:" + result[0].Viesti);
  			seTupViesti(result);
      }
  	});	
  }

  function seTupViesti(result){
		viesti = result[0].Viesti;
  	console.log("viesti: " + viesti);
  	asetaSaa();
  }

  function asetaSaa(){
    var url = "http://api.openweathermap.org/data/2.5/weather?q="+saa+"&units=metric&appid=5547c86c9c193df9f6cfb0724ff6994e";
    var http = require('http');

    http.get(url, function(res){
      var body = '';

      res.on('data', function(chunk){
        body += chunk;
      });

      res.on('end', function(){
        var saaData = JSON.parse(body);
        keli = saaData.main.temp;
        iconId = saaData.weather[0].icon;
        console.log("Got a response: ",keli , saaData , iconId);
        asetaRuoka();
      });
    }).on('error', function(e){
        console.log("Got an error: ", e);
      });
  }

  function asetaRuoka(){
    var url = "http://www.amica.fi/modules/json/json/Index?costNumber=0235&language=fi";
    var http = require('http');

    http.get(url, function(res){
      var body = '';
      res.on('data', function(chunk){
        body += chunk;
      });

      res.on('end', function(){
        var ruokaLista = JSON.parse(body);
        ruoka = ruokaLista.MenusForDays;
        if(typeof ruoka !== 'undefined' && ruoka.length > 0){ //Ruokalista on array ja tässä tarkistetaan että se ei ole tyhjä
          console.log("Ruokana tänään: ",ruoka);
          vastaa();
        }else{
          ruoka = "Ei ruokaa tänään"
          console.log("Ruokana tänään: ",ruoka);
          vastaa();
        }
      });
    }).on('error', function(e){
        console.log("Got an error: ", e);
    });
  }

  function vastaa(){
    response.render("index", { 
  	 ryhma: ryhma,
  	 saa: saa,
  	 viesti: viesti,
     keli: keli,
     ruoka: ruoka,
     saaId: iconId
    });
    console.log("Vastattu");
    //Asetetaan BeaconStatuksen	ryhma arvo.
    if(key == 32109){
      beaconStatus.beacon1.ryhma = ryhma;
    }
    if(key == 60020){
      beaconStatus.beacon2.ryhma = ryhma;
    }
    if(key == 18494){
      beaconStatus.beacon3.ryhma = ryhma;
    }
  }
}