app = require('express.io')()
app.http().io()
Jeu = require('./Jeu.js');

var tabJoueur = []; // buffer de joueurs a rajouter au jeu
var tabDirection = new Array(); //buffer de joueurs + directions

// donne la page html au joueur
// Send the client html.
app.get('/', function(req, res) {
   res.sendfile(__dirname + '/client.html')
})
app.get('/css/style.css', function(req, res) {
    res.sendfile(__dirname + '/css/style.css')
})
app.get('/css/reset.css', function(req, res) {
    res.sendfile(__dirname + '/css/style.css')
})
app.get('/js/jquery.js', function(req, res) {
    res.sendfile(__dirname + '/js/jquery.js')
})
app.get('/js/myscript.js', function(req, res) {
    res.sendfile(__dirname + '/js/myscript.js')
})

//ajoute un joueur au buffer et sauvegarde sa socket
app.io.route('ready', function(req){
	var objet = {};
	objet.nom = req.data;
    	console.log(req.data);
	objet.socket = req.io;
	tabJoueur.push(objet);
})

//ajoute le nom du joueur avec sa direction dans tableauDirection
app.io.route('change-direction', function(req){
	var i = 0;
	var nom = req.data.playerName;
	var direction = req.data.direction;
	console.log("--------------------------------------------");
	console.log("------------------nom "+req.data.playerName);
	console.log("------------------direction "+req.data.direction);
	console.log("--------------------------------------------");
	
	for (var i = 0; i < tabDirection.length; i++) {
		if(tabDirection[i].nom === nom) {
			tabDirection[i].direction = direction;
			console.log("direction changed");
		}
	}
})

// remet le jeu a zero
function resetServer() {
	Jeu.reset();
	tabDirection = [];
	tabJoueur = [];
	console.log("jeu reset");
}

//boucle du jeu, donne les commandes au jeu et contacte les joueurs
function live(){
    console.log("cycle");
    while(tabJoueur.length>0){ //ajoute les joueurs
    	var Joueur = tabJoueur.pop();
    	var nomJoueur = Jeu.addJoueur(Joueur.nom);
        var objet = {};
        objet.nom = nomJoueur;
        objet.direction = null;
        tabDirection.push(objet);
        Joueur.socket.emit('connected', nomJoueur);
        console.log("connected "+ nomJoueur);
        if(Jeu.active) {
            Joueur.socket.emit('start');
            console.log("jeu satarted new player");
            Joueur.socket.emit('update', Jeu.curState());
            app.io.broadcast('update', Jeu.newState());
        }
    }
    
	console.log("nb de joueur: " + Jeu.joueurs.length);
	console.log("jeu actif: " + Jeu.active);
	
    if(Jeu.joueurs.length>1 && !Jeu.active){ //si on a plus d'un joueur et le jeu n'est pas actif
        Jeu.start(); //on demmarre le jeu
        console.log(Jeu.active);
        app.io.broadcast('start');
        app.io.broadcast('update', Jeu.curState());
        console.log("jeu satarted");
    }

    if(Jeu.active){
        //changer direction
        for(var i = 0; i<tabDirection.length; i++) {
            Jeu.changeDirection(tabDirection[i].nom, tabDirection[i].direction);
			console.log("direction changed in live")
			console.log(tabDirection[i].direction)
        }

        Jeu.next();
	
	    //morts recupere un tableau de joueurs morts a contacter
        var morts = Jeu.collision();
        app.io.broadcast('lost', morts);
        
        app.io.broadcast('update', Jeu.newState());
        if(Jeu.end()){
    	    console.log("jeu fini");
            var win = Jeu.winner(); //on sauvegarde le gagnant qu'on contactera si il y en a un
            if(win !== null) app.io.broadcast('win', win);

            //on prepare le jeu pour la prochaine partie
    	    resetServer();
        }
    }
    setTimeout(live, 100);
}
live();

app.listen(7076)
