#-*- mode: org -*-
#+STARTUP: showall

* Server Accepts These Socket Events
** Request New Game
   - /@param/ Request Object
     - opponent (optional) :: the uid of an opponent. If ommitted, 
	  defaults to 'Machine'.
     - player (optional) :: Either 'x' or 'o'. Defaults to 'x'.

   - /@return/ Response Object
     - error :: Only if error in creating the game.
     - ok :: That way... you have it.
     - game :: Of Class:Game.
** Hello
   + /@param/ Request Object
      - user :: a unique id to register the user. Currently 
           generatedby a random number.

   + /@return/ null
** Move Request
   + /@param/ Request Object
     - gid :: The unique gid of the current game.
     - player :: The requesting player. Either 'x' or 'o'.
     - from :: The current index of the moving piece.
     - to :: The index requested of the moving piece.
     - piece :: The DOM ID of the piece. E.g., 'player0'.

   + /@return/ Response Object - sent to requester
     - error :: If there is one.
     - errReason :: If there is one.
     - request :: Ce qui est arrivee comme l'objet de la requete
     - game :: The updated Class:Game object.

