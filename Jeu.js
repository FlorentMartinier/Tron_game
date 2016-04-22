//Module de coordonnées de joueur
function Coordonnee(x, y) {
    this.x = x;
    this.y = y;

    this.copy = function () {
        return new Coordonnee(this.x, this.y);
    };

    this.equals = function (Coordonnee) {
        return this.x === Coordonnee.x && this.y === Coordonnee.y;
    };
}

//Module de joueur
function Joueur(nom) {
    this.nom = nom;
    this.direction = null;
    this.position = {};
    this.trace = [];
    
    // mise a jour de la position d'un joueur
    this.setPos = function(position) {
		this.position = position;
		this.trace.push(this.position.copy());
	}
    
    // mise a jour de la direction d'un joueur
    this.changeDirection = function (direction) {
        if (direction === "right" || direction === "left") {
            if (this.direction === "up" || this.direction === "down") {
                this.direction = direction;
				console.log("direction changed in player");
            }
        } else if (direction === "up" || direction === "down") {
            if (this.direction === "right" || this.direction === "left") {
                this.direction = direction;
				console.log("direction changed in player")
			}
        }
        return this;
    };
    
    // le joueur avance d'une case en fonction de la direction
    this.avancer = function () {
        if(this.direction === "right") {
            this.position.x++;
            this.trace.push(this.position.copy());
        } else if (this.direction === "left") {
            this.position.x--;
            this.trace.push(this.position.copy());
        } else if (this.direction === "up") {
            this.position.y--;
            this.trace.push(this.position.copy());
        } else if (this.direction === "down") {
            this.position.y++;
            this.trace.push(this.position.copy());
        }
        return this;
    };
}

var active = false;				//Etat du jeu
var joueurs = [];				//Tableau de {Joueur actif, [coordonee]}
var morts = [];					//Tableau de {Joueur mort, [coordonee]}
var HAUTEUR = 40;				//Hauteur du canvas en nb de moto
var LARGEUR = 70;				//Largeur du canvas en nb de moto
var canvas;						//Tableau a deux dimension, les cases sont initialiser a true quand elle sont prise par un joueur
var defCoo = {x: [], y: []};	//Objet de Coordonees par defaut
defCoo.x = [17, 53, 53, 17];	//init des x par defaut
defCoo.y = [10, 30, 10, 30];	//init des y par defaut

var setCanvas = function() {
	canvas = new Array(LARGEUR);
	for(var i = 0; i<canvas.length; i++){
		canvas[i] = [];
	}
}

setCanvas();

// renvoie vrai si le joueur est sorti du canvas
var outOfCanvas = function (coordonnee) {
    return coordonnee.x >= LARGEUR || coordonnee.x < 0 || coordonnee.y >= HAUTEUR || coordonnee.y < 0;
};

// vrai si le jeu est actif
var start = function () {
	this.active = true;
	console.log("active: " + active);
};

//retourne une coordonnee libre du canvas
var coorLibre = function () {
	 //test pour les coordonnées preferees de depart
	for(var i = 0; i < defCoo.x.length; i++) {
		if (typeof(canvas[ defCoo.x[i] ][ defCoo.y[i] ]) === 'undefined') {
			return new Coordonnee(defCoo.x[i], defCoo.y[i]);
		}
	}
    
    //parcours de tout le canvas
    for (i = 0;  i < LARGEUR; i++) {
        for (j = 0; j < HAUTEUR; j++) {
            if (typeof(canvas[i][j]) === 'undefined') { //exemple de test pour une coordonnée preferee de depart
                var position = new Coordonnee(i, j);
				return position;
            }
        }
    }
};

//determine la bonne direction a donner initialement au joueur
var defaultDirection = function (coordonnee) {
    var direction = null;
            
    if (coordonnee.y < HAUTEUR / 2) { 	    //en haut
        if (coordonnee.x < LARGEUR / 2) {	//en haut a gauche
            direction = "down";
        } else { 							//en haut a droite
            direction = "left";
        }
    } else { 							    //en bas
        if (coordonnee.x < LARGEUR / 2) {	//en bas a gauche
            direction = "right";
        } else { 							//en bas a droite
            direction = "up";
        }
    }
            
    return direction;
};

//ajoute une marque au canvas pour la coordonne
var prendreCoor = function (coordonnee) {
	if(!outOfCanvas(coordonnee)) {
		canvas[coordonnee.x][coordonnee.y] = true;
	}
};

//vérifie si un nom est pris, si oui en renvoie un nouveau
var checkName = function (joueur) { 
    var res = joueur;
	for (i = 0; i < joueurs.length; i++) {
        if (joueurs[i].nom === joueur) {
            var lastCar = joueur.charAt(joueur.length - 1);
            if (isNaN(lastCar)) {
                res = joueur.concat(1);    //ajoute un 1 a ma fin du nom
            } else {
				lastCar++;
                res = joueur.slice(0, joueur.length - 1).concat(lastCar);//ajout de lastCar++ au nom 
            }
        }
    }
	for (j = 0; j < morts.length; j++) {
        if (morts[j].nom === joueur) {
            var lastCar = joueur.charAt(joueur.length - 1);
            if (isNaN(lastCar)) {
                res = joueur.concat(1);    //put 1 at the end of joueur
            } else {
				lastCar++;
                res = joueur.slice(0, joueur.length - 1).concat(lastCar);//put lastCar++ at joueur.charAt(joueur.length - 1   
            }
        }
    }
	
	if(joueur !== res) {	//doublecheck nessesary
		res = checkName(res);
	}
	
    return res;
};

//ajoute le nouveau joueur a this.joueurs, donne une coordonnee libre au joueur, et renvoie le nom du joueur
var addJoueur = function (joueur) {	
    var nJoueur = checkName(joueur);
    var jo = new Joueur(nJoueur);
    jo.setPos(coorLibre());
    prendreCoor(jo.position);
    jo.direction = defaultDirection(jo.position);
    joueurs.push(jo);
	return nJoueur;
};
		
// change la direction d'un joueur
var changeDirections = function (name, direction) {
    var nom = name;
    for (i = 0; i < joueurs.length; i++) {
        if (joueurs[i].nom === nom) {
            joueurs[i].changeDirection(direction);
			console.log("direction changer dans jeu");
			
            break;
        }
    }
	console.log(direction);
};

//fait avancer tous les joueurs et met a jour les traces
var next = function () {
    for (i = 0; i < joueurs.length; i++) {
        joueurs[i].avancer();
        prendreCoor(joueurs[i].position);
    }
};
		
//renvois le fichier JSON a donner au client
var curState = function () {
    var table = [];
    for (i = 0; i < joueurs.length; i++) {
        var object = {};
        object.nom = joueurs[i].nom;
        object.trace = joueurs[i].trace;
        table.push(object);
    }
	for (j = 0; j < morts.length; j++) {
        var object = {};
        object.nom = morts[j].nom;
        object.trace = morts[j].trace;
        table.push(object);
    }
            
    return JSON.stringify(table);
};

//renvois le fichier JSON a donner au client
var newState = function () {
    var table = [];
    for (i = 0; i < joueurs.length; i++) {
        var object = {};
        object.nom = joueurs[i].nom;
        object.trace = [];
        object.trace[0] = joueurs[i].position;
        table.push(object);
    }
            
    return JSON.stringify(table);
};

var collisionJ = function(joueur) {		//teste si il y a une collision du joueur donner avec d'autre joueur
	for(var i = 0; i < joueurs.length; i++) {
		for(var j = 0; j < joueurs[i].trace.length; j++) {
			if(joueur===joueurs[i] && j+1 === joueurs[i].trace.length) { //ignore if j and i is same player and if trace is current position
				console.log("collision check jump");
				continue;
			}
			if(joueur.position.equals(joueurs[i].trace[j])) {
				return true;
			}
		}
	}
	return false;
}

// verification de collision
var collisionM = function(joueur) {
	for(var i = 0; i < morts.length; i++) {
		for(var j = 0; j < morts[i].trace.length; j++) {
			if(joueur.position.equals(morts[i].trace[j])) {
				return true;
			}
		}
	}
	return false;
}

//change l'etat d'un joueur de vivant a mort
var kill = function(victime) {
	for(var i = 0; i<joueurs.length; i++) {
		if(victime === joueurs[i].nom) {
			morts = morts.concat(joueurs.splice(i, 1));
			
			break;
		}
	}
}
    
//cherche, tue et renvoie le nom des joueurs qui on fait une collision
var collision = function () {
    var res = [];
    var found = false;
    var mort;
    
    for (i = 0; i < joueurs.length; i++) {	//On vérifie pour chaque joueur qu'il n'y ait pas de collision
        if(outOfCanvas(joueurs[i].position)) {
            res.push(joueurs[i].nom);
			
			console.log("out-of-canvas");
			console.log(joueurs[i].nom);
        } else if(collisionJ(joueurs[i])) {
			res.push(joueurs[i].nom);
			
			console.log("collision avec joueur");
			console.log(joueurs[i].nom);
		} else if(collisionM(joueurs[i])) {
			res.push(joueurs[i].nom);
			
			console.log("collision avec mort");
			console.log(joueurs[i].nom);
		}
	}
	
	for(var i = 0; i<res.length; i++) {
		kill(res[i]);
	}
	
	return res;
};
		
//renvois true si il y a 1 joueur ou moins
var end = function () {
    return (joueurs.length < 2);
};
		
//renvois le gagnant ou null
var winner = function () {
    if (joueurs.length === 1) {
        return joueurs[0].nom;
    }
    return null;
};
	    
//recommence le jeu
var reset = function () {
    this.active = false;
	console.log("active: " + active);
    joueurs.splice(0);
    morts.splice(0);
    setCanvas();
};

module.exports.start = start;
module.exports.active = active;
module.exports.joueurs = joueurs;
module.exports.addJoueur = addJoueur;
module.exports.changeDirection = changeDirections;
module.exports.next = next;
module.exports.curState = curState;
module.exports.newState = newState;
module.exports.collision = collision;
module.exports.end = end;
module.exports.winner = winner;
module.exports.reset = reset;