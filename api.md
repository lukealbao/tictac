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
<li><a href="#sec-2">2. <span class="todo TODO">TODO</span> Fixes</a>
<ul>
<li><a href="#sec-2-1">2.1. <span class="todo TODO">TODO</span> Animation Z-index</a></li>
<li><a href="#sec-2-2">2.2. <span class="todo TODO">TODO</span> Send current game state with move request errors</a></li>
<li><a href="#sec-2-3">2.3. <span class="todo TODO">TODO</span> Put AI into child processes</a></li>
<li><a href="#sec-2-4">2.4. <span class="todo TODO">TODO</span> Stagger move animations</a></li>
<li><a href="#sec-2-5">2.5. <span class="todo TODO">TODO</span> First Move Problem</a></li>
<li><a href="#sec-2-6">2.6. <span class="done DONE">DONE</span> Pieces becoming unmovable</a></li>
<li><a href="#sec-2-7">2.7. <span class="done DONE">DONE</span> pendingMoves() doesn't work as expected.</a></li>
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
    -   **gid:** The unique game identifier.
    -   **player:** 'x' or 'o'. Used to identify DOM pieces.

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
    -   **ok:** Boolean.
    -   **error:** If there is one.
    -   **errReason:** If there is one.
    -   **winner:** Null,'x', or 'o'.
    -   **request:** Ce qui est arrivee comme l'objet de la requete.
    -   **moves:** A map of DOM ids of elements to their new indexes.
    -   **nextMove:** 'x' or 'o', whoever's turn it is.
    -   **x:** The state of all of x's pieces. Used by AI.
    -   **o:** The state of all of o's pieces. Used by AI.

-   *@return* \*Event: 'Your Move'\* - Response object sent to opponent
    -   **ok:** Boolean.
    -   **error:** If there is one.
    -   **errReason:** If there is one.
    -   **winner:** Null,'x', or 'o'.
    -   **request:** Ce qui est arrivee comme l'objet de la requete.
    -   **moves:** A map of DOM ids of elements to their new indexes.
    -   **nextMove:** 'x' or 'o', whoever's turn it is.
    -   **x:** The state of all of x's pieces. Used by AI.
    -   **o:** The state of all of o's pieces. Used by AI.

# TODO Fixes<a id="sec-2" name="sec-2"></a>

## TODO Animation Z-index<a id="sec-2-1" name="sec-2-1"></a>

-   **Problem:** A moving piece is sent underneath other pieces.
-   Look to Greensock API for z-index while doing \`#sendPiece()\`.

## TODO Send current game state with move request errors<a id="sec-2-2" name="sec-2-2"></a>

-   **Problem:** Certain times, AI appears to move, and it is the player's turn; the player takes a move, but most spaces are occupied. This will allow debugging.

## TODO Put AI into child processes<a id="sec-2-3" name="sec-2-3"></a>

-   **Problem:** Server becomes unresponsive when searching for a move.
-   Spawn child processes for AI workers.
-   Create a queue for round-robining the workers.

## TODO Stagger move animations<a id="sec-2-4" name="sec-2-4"></a>

-   **Problem:** Animations happen all at once and is disorienting in a bad way.
-   Look to: reforming the \`Move Response\` API so that a single move is in a separate field from the reorientation moves. Then use two different timeouts on the client side.

## TODO First Move Problem<a id="sec-2-5" name="sec-2-5"></a>

-   **Problem:** Always chooses an opposite corner.
-   Look to the scoring mechanism.

## DONE Pieces becoming unmovable<a id="sec-2-6" name="sec-2-6"></a>

-   **Problem:** Unpredictably, a piece is no longer draggable, and other moves return as out of bounds.
-   Look to losing consistency between the model and the idxs of DOM pieces.
-   Look to the \`$env.pendingMoves\` issue.
-   **Solution:** Added hash to jQuery call in #sendMove

## DONE pendingMoves() doesn't work as expected.<a id="sec-2-7" name="sec-2-7"></a>

-   **Problem:** When moving another piece before submitting a move, the first is not sent back, as it should be.
-   This probably affects the prior todo.
-   **Solution:** Added hash to jQuery call in #sendMove