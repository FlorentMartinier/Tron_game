$(document).ready(function(){

    // Initialisation du canvas
    var canvas = $("#canvas")[0],
        context = canvas.getContext("2d"),
        width = $("#canvas").width(), // largeur du canvas
        height = $("#canvas").height();// longueur du canvas

    // Définition des variables principales
    var cw = 10, // taille de chaque case sur le canvas
        direction, // direction des joueurs (left|right|up|down)
        tronArray,// tableau de coordonnées total
        playerName,//nom de joueur
        isAcceCont = false,//Activation d'accéléromètre
        playerColor,//couleur de joueur
        isOffline = false,//Activation  offline player
        tabIndex = [],// tableau de toutes les coordonnées d'un joueur
        nomJoueur=[];// tableau de tous les noms de joueurs

    //>>>---interaction avec le serveur ---

    //connexion avec le serveur
    io.on('connected', function(data){
        playerName = data;
        if($(window).DeviceMotionEvent != undefined) {
            isAcceCont=true;
            startAccelerometreController();
        }
         startKeyController();
        isOffline = true;
        playerOffline.init();//initialisation offline Player
    });

    //reception des informations de joueurs
    io.on('update', function(data){
        // construction du canvas avec données
        // les données sont en JSON et sont un ensemble de coordonnée + nom
        var tabJoueur = JSON.parse(data);
        for(var i = 0; i<tabJoueur.length; i++) {
            var traceAdded = false;
			var newJData = tabJoueur[i];
            for(var j = 0; j<tabIndex.length; j++) {
                if (newJData.nom===tabIndex[j].nom) {
                    tabIndex[j].trace = tabIndex[j].trace.concat(newJData.trace);
                    traceAdded = true;
                }
            }
            if (!traceAdded) {
            	if(newJData.nom === playerName) {
            		newJData.col = playerColor;
                    $(".joueur").prepend("<li style='color:"+newJData.col+"' id='"+newJData.nom+"'>Vous: "+newJData.nom+"</li>");
            	} else {
            		newJData.col = getRandomColor();
                    $(".joueur").append("<li style='color:"+newJData.col+"' id='"+newJData.nom+"'>"+newJData.nom+"</li>");
            	}
                tabIndex.push(newJData);
            }

        }
        draw();
    });
    // demarrage du jeu en ligne
    io.on('start', function(){
		direction = null;
        isOffline = false;
        $("#block_loader").fadeOut(600,function(){
            $(".joueur").fadeIn(500);
        });
        context.clearRect(0, 0, width, height);
        init();

    });

    // définition du  joueur perdant
    io.on('lost', function(data){
        //recois le nom du perdant
         for(var i = 0; i<data.length; i++) {
            $("#"+data[i]).css({'text-decoration':'line-through'});
            if(data[i] === playerName){
                stopKeyController();
                isAcceCont=false;
                youLost();
            }
        }
     });

    //definition du gagnant
    io.on('win', function(data){
    //recois le nom du gagnant
        if(data === playerName){
               stopKeyController();
            isAcceCont=false;
            youWin();
        }
    });

    //definition de fin de jeu
    io.on('end', function(){
        stopKeyController();
        isAcceCont=false;
        $("#message_win").text("Jeu est Fini");
        youWin();
    });
    //<<<---Fin d'interaction avec le serveur---

    //>>>---dessin du Tron en mode online
    //initialisation d'elements sur l'ecran
    function init(){
        context.clearRect(0,0, width, height);
        context.strokeRect(0,0, width, height);
        context.strokeStyle = "#eee";
        context.stroke();
    }

    //logique de base
    function draw(){
        //dessin du tron
        for(var i = 0; i<tabIndex.length; i++) {
            for(var j = 0; j<tabIndex[i].trace.length; j++) {
                context.fillStyle = tabIndex[i].col;
                context.fillRect(tabIndex[i].trace[j].x*cw, tabIndex[i].trace[j].y*cw, cw, cw);
            }
        }
    }
    //<<---Fin des fonctions de dessin du Tron en mode online

    //generation de la couleur aléatoire
    function getRandomColor() {
        var colorRandom = "#"+((1<<24)*Math.random()|0).toString(16);
        for(var i = 0; i<tabIndex.length; i++) {
            if(colorRandom === tabIndex[i].col){
		getRandomColor();
            }
        }
        return colorRandom;
    }

    //contrôle des boutons
    function startKeyController() {
        $(document).keydown(function (e) {
            var key = e.which;//définition du code du bouton courant
            var ObjectData = new Object();
            ObjectData.playerName = playerName;
            if (key == "37" && direction != "right") {
                direction = "left";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "38" && direction != "down") {
                direction = "up";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "39" && direction != "left") {
                direction = "right";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "40" && direction != "up") {
                direction = "down";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "81" && direction != "right") {
                direction = "left";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "90" && direction != "down") {
                direction = "up";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "68" && direction != "left") {
                direction = "right";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
            else if (key == "83" && direction != "up") {
                direction = "down";
                ObjectData.direction = direction;
                io.emit('change-direction', ObjectData);
            }
        });
    }
    //arret de contrôle des boutons
    function stopKeyController(){
        $(document).unbind("keydown");
    }

    //Offline Player
    var playerOffline = {
        //initialisation d'elements sur l'ecran
       init: function (){
           if(isOffline==true) {
               direction = "right";//direction du tron par défaut
               playerOffline.createTron();

               if (typeof gameLoop != "undefined") {
                   clearInterval(gameLoop);
               }
               context.clearRect(0, 0, width, height);
               context.strokeRect(0, 0, width, height);
               gameLoop = setInterval(playerOffline.draw, 100);
           }

        },
        //création du tron (ajout dans le tableau)
        createTron : function(){
            if(isOffline==true) {
                tronArray = [];
                tronArray.push({x: 0, y: 0});
            }
        },
        //logique de base
        draw : function (){
            if(isOffline==true) {
                var headTron; //contient les coordonnées du futur "tete" du tron

                //actuelle de la tête du tron
                var nx = tronArray[0].x,
                    ny = tronArray[0].y;

                //on change la direction du tron en fonction de la valeur de la variable de "direction"(left|right|up|down)
                if (direction == "right") {
                    nx++;
                } else if (direction == "left") {
                    nx--;
                } else if (direction == "up") {
                    ny--;
                } else if (direction == "down") {
                    ny++;
                }

                //verification de la collision du Tron avec lui-même ou avec les limites de la grille de canvas
                if (nx == -1 || nx == width / cw || ny == -1 || ny == height / cw || playerOffline.checkCollision(nx, ny, tronArray)) {
                    playerOffline.init();
                    return;
                }
                else {
                    //Si pas de collision, le tron avance
                    headTron = {x: nx, y: ny}
                    headTron.x = nx;
                    headTron.y = ny;
                    //ajout de cellule "headTron" au début du tableaux tronArray
                    tronArray.unshift(headTron);
                }

                //dessin du tron
                for (var i = 0; i < tronArray.length; i++) {
                    var cell = tronArray[i];
                    playerOffline.drawCells(cell.x, cell.y);
                }
            }
        },

        //dessin du tron
        drawCells : function(x,y){
            if(isOffline==true) {
                context.fillStyle = playerColor;
                context.shadowColor = 'white';
                context.fillRect(x * cw, y * cw, cw, cw);
            }
        },

        //vérification des zones de collision
        checkCollision : function(x,y,array){
            if(isOffline==true) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i].x == x && array[i].y == y) return true;
                }
                return false;
            }
        }

    };

    //>>>---effets d'animation---//
    function showMainMenu(){
        $("#get_menu").fadeOut(200,function(){
            $("#block_jeu").fadeOut(200,function(){
                $("main").animate(
                    {
                        width: "350px",
                        height: "150px"
                    },
                    300,function(){
                        $("#player_name").val(playerName);
                        $("#player_color").val(playerColor);

                        $("#restart_menu").fadeIn(300);
                    }
                );
            });
        });
    }

    //affichage du message de defaite
    function youLost(){
        $("#message_err").fadeIn(200, function(){
            setTimeout(function(){
                $("#message_err").fadeOut(200, function(){
                    $("#get_menu").fadeIn(200);
                });
            }, 1000);
        });
    }

    //affichage du message de victoire
    function youWin(){
        $("#message_win").fadeIn(200, function(){
            setTimeout(function(){
                $("#message_win").fadeOut(200, function(){
                    $("#get_menu").fadeIn(200);
                });
            }, 1000);
        });
    }
    //<<<---Fin d'effets d'animation---//

    //commande de tron grace à rotation de téléphone portable(pour mobiles)
    function startAccelerometreController(){
        if(isAcceCont){
                $(window).ondevicemotion = function(e) {

                    if (e.accelerationIncludingGravity.x > 0 && direction != "right") {
                        direction = "left";
                        ObjectData.direction = direction;
                        io.emit('change-direction', ObjectData);
                    }
                    else if (e.accelerationIncludingGravity.x < 0 && direction != "left") {
                        direction = "right";
                        ObjectData.direction = direction;
                        io.emit('change-direction', ObjectData);
                    }
                    else if (e.accelerationIncludingGravity.y < 0  && direction != "down") {
                        direction = "up";
                        ObjectData.direction = direction;
                        io.emit('change-direction', ObjectData);
                    }

                    else if (e.accelerationIncludingGravity.y > 0  && direction != "up") {
                        direction = "down";
                        ObjectData.direction = direction;
                        io.emit('change-direction', ObjectData);
                    }
                }
        }
    }

    //>>>---ecouteurs d'événements---//
    //limitation de caractères d'entrée dans le input "player_name"
    $("#player_name").keyup( function() {
        var valCurrent = $(this);
        if(valCurrent.val().length > 10)
            valCurrent.val(valCurrent.val().substr(0, 10));
    });

    //initialisation de données et demmarage du jeu
    $("#btn_start").click(function(e){
        var pName;
        $("#player_name").val() == "" ?  pName = "Player 1" :  pName = $("#player_name").val();
        io.emit('ready', pName);
        playerColor = $("#player_color").val();
        e.preventDefault();
        $("aside").fadeOut(300,function(){
            $("main").animate(
                {
                    width: "870px",
                    height: "408px"
                },
                300,function(){
                    $("#block_jeu").fadeIn(300);
                });
        });
    });

    //restart du jeu
    $("#restart_game").click(function(e){
        tabIndex = [];
        nomJoueur=[];
        io.emit('ready', playerName);
        e.preventDefault();
        $("#block_loader").show();
        $(".joueur").hide();
        $(".joueur > *").remove();
        $("#restart_menu").fadeOut(300,function(){
            $("main").animate(
                {
                    width: "870px",
                    height: "408px"
                },
                300,function(){
                    $("#block_jeu").fadeIn(300);
                });
        });
    });

    //affichage du menu de jeu
    $("#get_main_menu").click(function(e){
        tabIndex = [];
        nomJoueur=[];
        e.preventDefault();
        $("#block_loader").show();
        $(".joueur").hide();
        $(".joueur > *").remove();
        $("#restart_menu").fadeOut(300,function(){
            $("main").animate(
                {
                    width: "342px",
                    height: "237px"
                },
                300,function(){
                    $("#start_menu").fadeIn(300);
                });
        });
    });

    //affichage du menu principal
    $("#get_menu").click(function(){
        showMainMenu();
    });
    //<<<---fin d'écouteurs d'événements---//
});








