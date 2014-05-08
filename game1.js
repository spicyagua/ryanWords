var WGNS = WGNS || {};

WGNS.app = (function() {


  //================================================
  // App-scope variables
  //================================================

  //Initial background color for the game page,
  //selected by JQM to look "native".  Stashed away during
  //init so it can be restored
  var origBackground = "";

  //Map of the values of the lists
  //to the lists themselves
  var listMap = {};


  var GAMESTATES = {
    INIT : 0,
    BETWEEN_ROUNDS : 1,
    IN_ROUND : 2
  };

  var newGame = function(teamNames, _numRounds, unrandomList, _roundDuration) {

    var nextUp = -1;
    var scoresByRound = [];
    var listPtr = 0;
    var currentRound = {};
    var state = GAMESTATES.INIT;

    //Copy then randomize list
    var theList = unrandomList.slice();
    for(var i = theList.length - 1; i>0; i--) {
      var j =  (i+1);
      j = Math.random() * (i+1);
      j = Math.floor(Math.random() * (i+1));

      var tmp = theList[i];
      theList[i] = theList[j];
      theList[j] = tmp;
    }

    //Both next and prev leave pointer at
    //*current* word being shown
    var nextWord = function() {
      if(++listPtr >= theList.length) {
        listPtr = 0;
      }
      console.log("nextWord returning: " + theList[listPtr]);
      return theList[listPtr];
    };

    var prevWord = function() {
      if(--listPtr <= 0) {
        listPtr = theList.length - 1;
      }
      console.log("prevWord returning: " + theList[listPtr]);
      return theList[listPtr];
    };

    var numRounds = function() {
      return _numRounds;
    };

    //Test if all rounds have been played
    var isDone = function() {
      return scoresByRound.length == _numRounds;
    };

    //returns -1 for a tie
    var getWinner = function() {
      //TODO This is goofy
      winsByIndex = [teamNames.length];
      for(var i = 0; i<winsByIndex.length; i++) {
        winsByIndex[i] = 0;
      }
      for(var i = 0; i<scoresByRound.length; i++) {
        winsByIndex[scoresByRound[i]]++;
      }

      var highestVal = 0;
      var highestIndex = 0;
      for(var i = 0; i<winsByIndex.length; i++) {
        if(winsByIndex[i] > highestVal) {
          highestVal = winsByIndex[i];
          highestIndex = i;
        }
      }

      for(var i = 0; i<winsByIndex.length; i++) {
        if(winsByIndex[i] == highestVal) {
          if(i != highestIndex) {
            return -1;
          }
        }
      }
      return highestIndex;
    };


    var roundDuration = function() {
      return _roundDuration;
    };

    var getCurrentRound = function() {
      return currentRound;
    };

    var endRound = function(winnerIndex) {
      scoresByRound.push(winnerIndex);
      currentRound = null;//Java habits die hard
      state = GAMESTATES.BETWEEN_ROUNDS;
    };

    /**
     * Creates a new round, incrementing
     * the rotation of who is up first.
     *
     * All references to teams are done by index into the
     * team name array
     */
    var newRound = function() {
      nextUp++;
      if(nextUp >= teamNames.length) {
        nextUp = 0;
      }
      currentRound =  {
        nextUp : nextUp,
        lastWinner : function() {
          scoresByRound[scoresByRound.length - 1];
        },
        isFirstRound : function() {
          return scoresByRound.length == 0;
        },
        roundNumber : function() {
          return scoresByRound.length + 1;
        }
      };
      state = GAMESTATES.IN_ROUND;
      return currentRound;
    };

    var getState = function() {
      return state;
    };

    return {
      teamNames : teamNames,
      scores : [],
      numRounds : numRounds,
//      category: "Loading...",
      getState : getState,
//      theList : theList,
      roundDuration : roundDuration,
      newRound : newRound,
      nextWord : nextWord,
      prevWord : prevWord,
      getCurrentRound : getCurrentRound,
      endRound : endRound,
      isDone : isDone,
      getWinner : getWinner
    };
  };

  //Initialize defaults
  currentGame = newGame(["Team Bacon", "Team Nahrwal"], 3, [], 2);



  var _controller = {};


  //FFFF00 (yellow)
  //FF6600 (orange)
  //FF0000 (red)
  var timePerColor = 1000;
  var colorIndex = 0;
  var colors = ["FFFF00", "FF6600", "FF0000"];

  //Workaround to issue w/ sound.  It seems browsers have a (reasonable)
  //feature that pages can't play sound unless the result of user interaction.
  //So, when the game expires I can't play the explosion.  I'm re-doing things
  //so the next tap/swipe after the time has expired will trigger the
  //end of game extravaganza
  var gameExpired = false;


  //Callback for "settimer"
  var timerCallback = function() {
    if(colorIndex >= colors.length) {

      gameExpired = true;
    }
    else {
      $('#gamepage').animate({ backgroundColor: "#" + colors[colorIndex]}, 1000);
      $("#gameText").css({"color":$.xcolor.complementary("#" + colors[colorIndex])});
      colorIndex++;
      currentTimer = setTimeout(timerCallback , timePerColor);
    }
  };

  var doEndRoundEffects = function() {

    var sound = $("#soundPlayer")[0];
    console.log("Got sound " + sound);
    sound.play();
    console.log("Played sound");

    navigator.vibrate = navigator.vibrate ||
                navigator.webkitVibrate ||
                navigator.mozVibrate ||
                navigator.msVibrate;
    if (navigator.vibrate) {
        console.log("About to vibrate phone");
        navigator.vibrate([3000]);
        console.log("Done vibrating (maybe)");
    }
    else {
      console.log("Vibrate not enabled");
    }



    $("#end_round_button_team_a").val(currentGame.teamNames[0]);
    $("#end_round_button_team_b").val(currentGame.teamNames[1]);
    $("#end_round_button_team_a").button("refresh");
    $("#end_round_button_team_b").button("refresh");

    //Delay popup so folks don't dismiss the dialog
    //as they were just frantically clicking
    setTimeout(function() {
      $("#end_round_dialog").popup( "open" );
    }, 1000);


  };



  //TODO HACK fix the timer mess
  var resetTimer = function() {

    colorIndex = 0;
    $("#gameText").css({"color":$.xcolor.complementary(origBackground)});
  };

  //Current timer, if we want to cancel.  I know I don''t have to declare it, but I just
  //have to get used to JS
  var currentTimer = {}

  var link1Click = function() {
    console.log(currentGame.counter++);
  };

  /*
  Function adds "option" and "optgroup" elements.  Note that I had some
  issues I can't recall (likely dumb syntax errors) preventing me
  from building the elements *then* attaching them to the DOM.  Current
  implementation is inefficent, but who really cares.  Its fast enough,
  although embarrasing.
  */
  var buildSelectFromJSON = function(parent, data, nameRoot) {
    if(!(data["name"])) {
      //Root node
      for(var i = 0; i<data["nodes"].length; i++) {
        buildSelectFromJSON(parent, data["nodes"][i], nameRoot);
      }
      return;
    }
    //TODO Escape the "name" so it is sure to be safe as a member of the map.  For now,
    //I know the data is clean.
    nameRoot = nameRoot + "_" + data["name"];
    if(data["nodes"]) {
      //Parent
      var newOptgroup = $("<optgroup></optgroup>").attr("label", data["name"]);
      parent.append(newOptgroup);
      for(var i = 0; i<data["nodes"].length; i++) {
        buildSelectFromJSON(newOptgroup, data["nodes"][i], nameRoot);
      }
    }
    else {
      //leaf node
      parent.append($("<option></option>").attr("value",nameRoot).text(data["name"]));
      listMap[nameRoot] = data["theList"];
    }
  };

  //This isn''t a navigation function, it is a logical function to prepare the
  //system to begin a game
  var begin_game = function() {
/*
    alert("The game is in a development mode where the round duration is ignored " +
      "and the round is only a few seconds long.  This is so I can test the transitions " +
      "between rounds/games");
*/
    console.log("begin game with " + ($('#category').val().length) + " categories");
    var catNames = $('#category').val();
    var mergedArray = [];
    for(var i = 0; i<catNames.length; i++) {
      mergedArray = mergedArray.concat(listMap[catNames[i]]);
    }
    console.log("Total items in list is " + mergedArray.length + " items long");
    currentGame = newGame(
      [$('#team1_name').val(), $('#team2_name').val()],
      $('#num_rounds').val(),
      mergedArray,
      $('#round_duration').val());

//Comment out for testing
    timePerColor = Math.round($('#round_duration').val()*1000*60/3);
    console.log("Time per color: " + timePerColor);
    //Navigate to game page
    jQuery.mobile.changePage("#gamepage", {transition:"slidefade"});
  };

  var endRound = function(winnerIdx) {
      unbindSwipeListeners();
      console.log("End round.  Winner was " + winnerIdx);
      currentGame.endRound([winnerIdx]);

      if(currentGame.isDone()) {

        $("#game_dialog_text").text("Game Complete");
        $("#game_dialog_title").text("TODO Put winner here or tie");
        $("#game_dialog_button_text").text("Ok");


        $('#game_dialog').on('popupafterclose.WGNS', function() {
          console.log("Callback after dismissing the end-game dialog");
          //Remove this listener
          $('#game_dialog').off('popupafterclose.WGNS');
          jQuery.mobile.changePage("#homepage", {transition:"slidefade"});
        });
        console.log("Restore background color (end of game)");
        $('#gamepage').animate({ backgroundColor: origBackground}, 1000, function() {
          console.log("Show end game dialog");
          $( "#game_dialog" ).popup( "open" );
        });


      }
      else {

        console.log("Continue to next round");
        console.log("Restore background color");
        $('#gamepage').animate({ backgroundColor: origBackground}, 1000, function() {
          beginRound();
        });

      }

  };


  var beginRound = function() {
    resetTimer();



    $("#gameText").css({"color":"black"});

    //Create a new round
    currentGame.newRound();
    var msg = "Get ready for round " + currentGame.getCurrentRound().roundNumber() +
      " of " + currentGame.numRounds() + ".  " +
      currentGame.teamNames[currentGame.getCurrentRound().nextUp] + " starts this round";

    $("#game_dialog_text").text(msg);
    $("#game_dialog_title").text("Round " + currentGame.getCurrentRound().roundNumber());
    $("#game_dialog_button_text").text("Let's Go!");
    console.log("Show pre-round dialog");
    //Display dialog
    $('#game_dialog').on('popupafterclose.WGNS', function() {
      bindSwipeListeners();
      var nextWord = currentGame.nextWord();
      console.log("Assign initial word of new round to be " + nextWord);
      $("#gameText").text(nextWord);
      console.log("Callback after dismissing the pre-round dialog");
      currentTimer = setTimeout(timerCallback , timePerColor);


      //Remove this listener
      $('#game_dialog').off('popupafterclose.WGNS');
    });
    $( "#game_dialog" ).popup( "open" );
  };

  _controller.gamepageShowing = function() {
    console.log("gamepageShowing");
   //currentGame can't be undefined.  The only route to this
   //from main page is via "begin_game"

    switch(currentGame.getState()) {
      case GAMESTATES.INIT:
      case GAMESTATES.BETWEEN_ROUNDS:
        beginRound();
        break;
      case IN_ROUND:
        break;
      default:
        console.error("Bad state: " + currentGame.state());
    }
  };
/*
  _controller.post_show_gamepage = function() {
    console.log("post_show_gamepage entered");
    //Figure out why we''re showing
    switch(currentGame.state) {
      case STATES.NO_GAME:
        alert("Error - impossible state.  Bill goofed");
        break;
      case STATES.PRE_GAME_1:
      case STATES.PRE_ROUND_1:
        currentGame.newRound();
        var msg = "Get ready for round " + currentGame.getCurrentRound().roundNumber() +
          " of " + currentGame.numRounds() + ".  " + //TODO List which round it is
          currentGame.teamNames[currentGame.getCurrentRound().nextUp] + " starts this round";
        //TODO Totally stupid way to do this
        var tmpGDT = $("#game_dialog_text");
        $("#game_dialog_text").text(msg);
        $("#game_dialog_title").text("Round " + currentGame.getCurrentRound().roundNumber());
        $("#game_dialog_button_text").text("Let'g Go!");
        console.log("Show pre-round/game dialog (need to fix that distinction");
        $( "#game_dialog" ).popup( "open" );
        currentGame.state = STATES.PRE_GAME_2;//
        break;
      case STATES.PRE_GAME_2:
        console.log("STATES.PRE_GAME_2.  Set the timer");
        currentTimer = setTimeout(timerCallback , timePerColor);
        var nextWord = currentGame.nextWord();
        console.log("Assign initial word to be " + nextWord);
        $("#gameText").text(nextWord);
        currentGame.state = STATES.IN_GAME;
        break;
      default:
        alert("Unknown state: " + currentGame.state);
    }
  };
*/



  var endRoundListeners = function(idx) {
    //Look mom!  A real use of closure!
    var ret = function(e) {
      $("#end_round_dialog").popup( "close");
      endRound(idx);
    };
    return ret;
  };


  var swipeTapListener = function(e) {
    console.log("swipeTapListener");
    //Check if we should explode
    if(gameExpired) {
      gameExpired = false;
      doEndRoundEffects();
      return;
    }
    if(e.type == "tap" || e.type == "swiperight") {
      console.log("swiperight/tap");
      var nextWord = currentGame.nextWord();
      console.log("Assign current word to " + nextWord);
      $("#gameText").text(nextWord);
    }
    else {
      console.log("swipeleft");
      var newWord = currentGame.prevWord();
      console.log("Assign current word to " + newWord);
      $("#gameText").text(newWord);
    }
  };

  var bindSwipeListeners = function() {
    console.log("Binding swipe listeners");
    $('#gamepage').on("swiperight tap", swipeTapListener);
    $('#gamepage').on("swipeleft", swipeTapListener);
  };

  var unbindSwipeListeners = function() {
    console.log("Unbinding swipe listeners");
    $('#gamepage').off("swiperight tap", swipeTapListener);
    $('#gamepage').off("swipeleft", swipeTapListener);
  };


  var buttonGlowTimer = function() {
    glowingStartTimer = setTimeout(function() {
      var origColor = $('#begin_game_button').css("color");
      $('#begin_game_button').animate(
        {"color": "red"},
        1000,
        function() {
          $('#begin_game_button').animate(
            {"color": origColor},
            1000,
            buttonGlowTimer)
        }
        )
    }, 3000);
  };

  //================================================
  // Page init callbacks
  //================================================

  var glowingStartTimer = 0;

  _controller.initHomePage = function() {

    console.log("Pre JSON");

    //Note "get" or "getJSON" silently fail if the parser fails - and you never
    //get a callback.  Sucks.  Dont seem to see a "failure" handler in the docs
    $.getJSON("data1.json", function(data, textStatus, jqXHR) {
      console.log("In JSON callback");
      console.log("JSON returned " + data);
      //TODO Error handling
      $('#category').empty();
      buildSelectFromJSON($('#category'), data, "");

      //JQM doesn't seem to initialize to
      //first element in select so force it.
      var keys = Object.keys(listMap);
      categoryEL.val(keys[0]);
      categoryEL.selectmenu("refresh", true);
    });

    console.log("Post JSON");

    $(document).on("pageshow.WGNS","#homepage", function() {
      console.log("Homepage showing");
      buttonGlowTimer();

    });
    $(document).on("pagehide.WGNS","#homepage", function() {
      console.log("Homepage hidden");
      clearTimeout(glowingStartTimer);
    });

    var team1_nameEL = $('#team1_name');
    var team2_nameEL = $('#team2_name');
    var num_roundsEL = $('#num_rounds');
    var categoryEL = $('#category');
    var round_durationEL = $('#round_duration');

    team1_nameEL.val(currentGame.teamNames[0]);
    team2_nameEL.val(currentGame.teamNames[1]);
    num_roundsEL.val(currentGame.numRounds());
    round_durationEL.val(currentGame.roundDuration);
    num_roundsEL.slider("refresh", true);
    round_durationEL.slider("refresh", true);

    //Listen to the "Begin Game" button
    var begin_game_button = $('#begin_game_button');
    begin_game_button.on('click', begin_game);



  };


  _controller.initGamePage = function() {

    //Since I'm using JQM navigation for going to game page,
    //this is a handy event to indicate we've visited (as opposed to
    //everywhere else where I explicitly listen to buttons and
    //such
    $(document).on("pageshow","#gamepage",_controller.gamepageShowing);

    $("#end_round_button_team_a").on('click', endRoundListeners(0));
    $("#end_round_button_team_b").on('click', endRoundListeners(1));

    //Nuke JQM styling of text (looks funny)
    $("#gameText").css({"text-shadow":"none"});

    //Stash original color
    origBackground = $('#gamepage').css("backgroundColor");;

  };

  /*
  Init function for app.  Should be the only thing exposed to
  the enclosing page (for now)
  */
  _controller.init = function() {
    //It would be cooler to have inits based on Strings, and bind and invoke just with a list
    //of page names vs. strong typing for everything
    $(document).on("pagecreate","#homepage",function(){
      //I've read some people complain this gets called
      //as pages are revisited.  I don't see that happening, but just in case
      //later I could use the ".off" function
      _controller.initHomePage();
    });
    $(document).on("pagecreate","#gamepage",function(){
      _controller.initGamePage();
    });
  }

  return {
    controller : _controller
  };

}());
