<div id="table-of-contents">
<h2>Table of Contents</h2>
<div id="text-table-of-contents">
<ul>
<li><a href="#sec-1">1. Server Accepts These Socket Events</a>
<ul>
<li><a href="#sec-1-1">1.1. Request New Game</a></li>
<li><a href="#sec-1-2">1.2. Hello</a></li>
<li><a href="#sec-1-3">1.3. Move Request</a></li>
</ul>
</li>
</ul>
</div>
</div>

\#-\*- mode: org -\*-

# Server Accepts These Socket Events<a id="sec-1" name="sec-1"></a>

## Request New Game<a id="sec-1-1" name="sec-1-1"></a>

-   *@param* Request Object
    -   **opponent (optional):** the uid of an opponent. If ommitted, 
        defaults to 'Machine'.
    -   **player (optional):** Either 'x' or 'o'. Defaults to 'x'.

-   *@return* Response Object
    -   **error:** Only if error in creating the game.
    -   **ok:** That way&#x2026; you have it.
    -   **game:** Of Class:Game.

## Hello<a id="sec-1-2" name="sec-1-2"></a>

-   *@param* Request Object
    -   **user:** a unique id to register the user. Currently 
        generatedby a random number.

-   *@return* null

## Move Request<a id="sec-1-3" name="sec-1-3"></a>

-   *@param* Request Object
    -   **gid:** The unique gid of the current game.
    -   **player:** The requesting player. Either 'x' or 'o'.
    -   **from:** The current index of the moving piece.
    -   **to:** The index requested of the moving piece.
    -   **piece:** The DOM ID of the piece. E.g., 'player0'.

-   *@return* Response Object - sent to requester
    -   **error:** If there is one.
    -   **errReason:** If there is one.
    -   **request:** Ce qui est arrivee comme l'objet de la requete
    -   **game:** The updated Class:Game object.