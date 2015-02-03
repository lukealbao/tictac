#Tic Tac Whoa

## What is this thing?
Tic-tac-toe, but with a reorienting board. The idea is that you have
three pieces. Once they are all in play, you move by moving a piece
somewhere else on the board.

The fun part is that a move is legal so long as the resulting board
fits on a 3x3 square. This means the 'x' player can reorient the
following board:

    x x o
      o x
      o

Instead of blocking o's diagonal win, x could move his leftmost piece
for a win of his own:

    x o
    o x
    o   x


I don't recall where I learned this game, but the original was played
with sugar packets while waiting for food at a restaurant. I've always
thought it was super cool.

http://ec2-54-88-138-145.compute-1.amazonaws.com:4040/

## Why is it here?
I intend to put this up live for people to play. The first version
should be up within a week or so. But you are seeing this because I'm
trying to find a job and this is some code I wanted to share. So, to
help anyone who wants to look over this, a brief description of the
repo:

## General structure
This game runs on Node via Express.js. It accepts HTTP requests and
populates the board with basic DOM elements, which are animated with
[GreenSock](http://www.greensock.com). All gameplay is then handled via Socket.io events. Game
state is housed in Redis. The current iteration only allows playing
against the AI, but further editions will incorporate human-to-human
playing and the ability to have multiple games running.

## Data representation
In order to manage move validation and AI operations, I chose to represent
game state as a [bit field](http://en.wikipedia/wiki/Bit_field).

A standard tic-tac-toe board is 3x3, which means it has 9 cells. That
means we can represent every configuration of pieces on the board as a
unique 9-bit integer. We simply match the filled cells with their
corresponding index number (starting at 0), and then set that bit on a
9-bit number.

For instance, say we only have one piece on the board, and it's in the
middle cell. How can we describe that state in a single number? We
take the cell's index (by our count, 4), and set the corresponding bit
on a 9-bit number in binary representation. That is, we set the bit at
index 4, which is 16 (`2^4 = 16`). And that's how. If we added a new
piece at cell-index-0, our new state is 17 (`2^4 + 2^0 = 17`).

This correspondence of cell-index to binary flag is crucial to
understanding anything in this repo.

**I've chosen to map index-0 to the bottom right of the board. The
 numbering goes up by one as you move right-to-left. The next index
 after hitting the left edge is the right edge (rather than the cell
 directly above).**

## Modules of note

### `./app.js`
The entry point into our app. Listens to HTTP and Socket.io
requests. It routes the former to the public html and js files, and
passes the latter through to the `game-controller` module.

### `./lib/game-controller`
The game controller module exports a constructor function for a
`GameController` object. It creates games and processes moves. Its
main public method is `processMoveRequest`. This method uses
`async.waterfall` to manage the callback tree of grabbing the game
from the database, verifying the move, reorienting the board if
needed, updating the database, and sending a response back to `app.js`
to be routed to the client.

### `./lib/struct`
This module builds the combinatorial structures needed to represent
the bit arrays, to perform bitwise operations on them, and to search
for valid moves. For simplicity, most of them begin life as a 9-bit
array and are then transformed to a 25-bit array. The full board is
25 bits to account for reorientations.

### `./lib/bits` & `./lib/bitboard`
Here are the lower-level bitwise functions used by the struct
module. Don't be scurred. Combinatorial fun to be had here.

### `./lib/ai-controller`
The AI connects to the app over a Socket.io connection, just like a
human client. It uses a form of the [Minimax
algorithm](http://en.wikipedia.org/wiki/Minimax) to search through all
available moves and find the best one. The `searchRoot` function is,
as might be deduced, the root function of searching for a move. It
takes the AI's current position, and looks up a list of all legal
moves from that position. It then calls the `alphaBeta` function on
each one of these options to generate a score for each one. It then
chooses the one with the highest score.

It uses [Alpha-beta pruning](http://www.en.wikipedia.org) to avoid
searching through solutions that are not worth searching. Aside from
basic minimax with alpha-beta, it has these particulars:

- `getMoves` is a function that looks up a position in the
  `#struct/moveGraph` for a list of legal moves. Those are generated
  by mapping all player states that are exactly one move apart.
- Additional (and aggressive) pruning is achieved by two means:
  1. Adjusting the `#struct/moveGraph` so that it treats all winning
  moves as leaf nodes. No point looking beyond any win, right?
  2. Pruning any option from the list of moves that will lead to an
  immediate loss. The `opponentWins` function takes a move and
  determines whether it leaves the opponent with an open cell which
  would make three-in-a-row. Any option that would lead to this is
  pruned. (Unless, there are no other options, in which case we have
  to keep it!)
- The `score` function (as well as the `opponentWins` function) make
  use of the `#struct/attackVectors` function. This function returns a
  list of all the bit-arrays that represent a three-in-a-row position
  on the current board. Through bitwise operations, we can quickly
  find out which vectors are in danger.



