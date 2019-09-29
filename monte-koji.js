'use strict';

//(function() {

  // Board is an object indexed a...g with a pair of numbers indicating "our" played cards and
  // "their" played cards for the given Geisha (and an optional previous value).
  function initialPosition() {
    return {a: [0,0], b: [0,0], c: [0,0], d: [0,0], e: [0,0], f: [0,0], g: [0,0]};
  }

  let geishaValues = {a: 2, b: 2, c: 2, d: 3, e: 3, f: 4, g: 5};

  // Compute heap for position and hand, where a hand is of the form:
  // { active: a list of geisha keys, e.g. ['a', 'b', 'b', 'g']
  //   discarded: an optional list of two discarded cards
  // }
  // The reserved card is not represented as we play it open on the board
  // (the random rollout opponent ignores it anyway.)
  function heap(pos, hand) {
    let result = {};
    for (let k in geishaValues) {
      let p = pos[k];
      result[k] = geishaValues[k] - p[0] - p[1];
    }
    for (let k of hand.active) {
      result[k]--;
    }
    if (hand.discarded) {
      result[hand.discarded[0]]--;
      result[hand.discarded[1]]--;
    }
    return result;
  }

  function size(heap) {
    let size = 0;
    for (let k in heap) {
      size += heap[k];
    }
    return size;
  }

  // Draw a random card from heap, chaning the given heap in
  function draw(heap) {
    let index = rnd(size(heap));
    for (let k in heap) {
      let count = heap[k];
      if (index < count) {
        heap[k]--;
        return k;
      }
      index -= count;
    }
    throw "Drawing beyond end of heap (should never happen).";
  }

  // integer random from [0..n)
  function rnd(n) {
    return Math.floor(Math.random() * n);
  }

  // -------------------- Move implementations --------------------

  // The four following moves all modify position and hand.
  // player is always 0 (us) or 1 (them)

  function move_reserve(player, position, hand, card) {
    position[card][player]++;
    removeCard(hand, card);
  }

  function removeCard(hand, card) {
    hand.active.splice(hand.active.indexOf(card), 1);
  }

  function move_discard(_player, _position, hand, cards) {
    hand.discarded = cards;
    removeCard(hand, cards[0]);
    removeCard(hand, cards[1]);
  }

  // opponent chose cards[0]
  function move_offer3(player, position, hand, cards) {
    let [card1, card2, card3] = cards;
    position[card1][1-player]++;
    position[card2][player]++;
    position[card3][player]++;
    removeCard(hand, card1);
    removeCard(hand, card2);
    removeCard(hand, card3);
  }

  // opponent chose cards[0] and cards[1], we chose ...[2] and [3]
  function move_offer22(player, position, hand, cards) {
    let [card1, card2, card3, card4] = cards;
    position[card1][1-player]++;
    position[card2][1-player]++;
    position[card3][player]++;
    position[card4][player]++;
    removeCard(hand, card1);
    removeCard(hand, card2);
    removeCard(hand, card3);
    removeCard(hand, card4);
  }


  // -------------------- Random player choice functions --------------------

  // All choice functions modify position, hand.

  function random_reserve(player, position, hand) {
    let card = hand.active[rnd(hand.active.length)];
    move_reserve(player, position, hand, card);
    return `reserve:${card}`;
  }

  function random_discard(player, position, hand) {
    let cards = putNCardsToFrontOfHand(hand, 2);
    move_discard(player, position, hand, cards);
    return `discard:${cards.sort().join('')}`;
  }

  // returns the n rearranged cards
  function putNCardsToFrontOfHand(hand, n) {
    let a = hand.active,
        l = a.length;
    for (let i = 0; i < n; i++) {
      a.splice(0, 0, ...a.splice(i + rnd(l - i), 1));
    }
    return a.slice(0, n);
  }

  function random_offer3(player, position, hand) {
    let offer = putNCardsToFrontOfHand(hand, 3);
    move_offer3(player, position, hand, offer);
    return `offer3:${offer.sort().join('')}`;
  }


  function random_offer22(player, position, hand) {
    let offer = putNCardsToFrontOfHand(hand, 4);
    move_offer22(player, position, hand, offer);
    return `offer22:${[offer.slice(0, 2).sort().join(''), offer.slice(2, 4).sort().join('')].sort().join()}`;
  }

  // options is an array of choice functions (corresponding to the game, tokens)
  function random_move(player, position, hand, options) {
    let move = options.splice(rnd(options.length), 1);
    return move[0](player, position, hand);
  }


  // -------------------- Play one game to its conclusion --------------------

  // modifies all of its arguments (apart from player)
  function rollout(player, position, hands, optionsForPlayers, drawPile) {
    while (optionsForPlayers[player].length > 0) {
      let hand = hands[player],
          options = optionsForPlayers[player];
      hands[player].active.unshift(drawFromPile(drawPile));
      random_move(player, position, hand, options);
      player = 1 - player;
    }
  }

  function drawFromPile(pile) {
    return pile.splice(rnd(pile.length), 1)[0];
  }

  // Player (0 or 1) that has more points, or when equal, more geishas.
  // +1 : player 0 wins
  // 0  : draw
  // -1 : player 1 wins
  function result(position) {
    let geishaDelta = 0,
        pointDelta = 0;
    for (let k in geishaValues) {
      let p = position[k];
      let s = Math.sign(p[0] - p[1]) || p[2] || 0;
      geishaDelta += s;
      pointDelta += s * geishaValues[k];
    }
    return pointDelta ? Math.sign(pointDelta) : Math.sign(geishaDelta);
  }

  // -------------------- Monte-Carlo move choice --------------------

  // position contains drawn card, player (AI) is always 0
  function mc_move(position, hand, opponentHandSize, optionsForPlayers, rollouts) {
    let stats = new Map();
    while(rollouts-- > 0) {
      mc_rollout(stats, positionCopy(position), handClone(hand), opponentHandSize,
        [optionsForPlayers[0].slice(), optionsForPlayers[1].slice()]);
    }
    return bestStats(stats);
  }

  function positionCopy(pos) {
    let newPos = {};
    for (let k in pos) {
      newPos[k] = pos[k].slice();
    }
    return newPos;
  }

  function handClone(hand) {
    return {
      active: hand.active.slice(),
      discarded: hand.discarded ? hand.discarded.slice() : undefined
    };
  }

  // position contains drawn card, player (AI) is always 0
  function mc_rollout(stats, position, hand, opponentHandSize, optionsForPlayers) {
    let hp = heap(position, hand),
        opponentHand = [],
        pile;
    if (!containsReserve(optionsForPlayers[1])) {
      let card = draw(hp);
      move_reserve(1, position, {active:[card]}, card);
    }
    for (var i = 0; i < opponentHandSize; i++) {
      opponentHand.unshift(draw(hp));
    }
    pile = makePileFromHeap(hp);
    let move = random_move(0, position, hand, optionsForPlayers[0]);
    rollout(1, position, [hand, {active: opponentHand}], optionsForPlayers, pile);
    let r = result(position),
        stat = stats.get(move);
    stats.set(move, [(stat ? stat[0] : 0) + 1, (stat ? stat[1] : 0) + r]);
  }

  function makePileFromHeap(heap) {
    let pile = [];
    while(size(heap) > 1) {
      pile.unshift(draw(heap));
    }
    return pile;
  }


  // does the array of options contain random_reserve
  function containsReserve(options) {
    return options.includes(random_reserve);
  }

  function bestStats(statsMap) {
    console.log(statsMap);
    let best;
    for (let [k, v] of statsMap.entries()) {
      if (!best || best[1] < v[1] / v[0]) {
        best = [k, v[1] / v[0]];
      }
    }
    console.log(best);
    return best[0];
  }

  function mc_choose3(position, hand, opponentHandSize, optionsForPlayers, offer3, rollouts) {
    let stats = new Map();
    for (let i = 0; i < 3; i++) {
      let picked = offer3.slice();
      picked.splice(0, 0, ...picked.splice(i, 1));
      let p = positionCopy(position);
      move_offer3(1, p, {active: picked.slice()}, picked);
      stats.set(picked[0], rolloutForChoice(p, hand, opponentHandSize, optionsForPlayers, rollouts));
    }
    return bestStats(stats);
  }

  function rolloutForChoice(position, hand, opponentHandSize, optionsForPlayers, rollouts) {
    if (optionsForPlayers[0].length === 0) {
      return [1, result(position)];
    }
    let stats = new Map();
    for(let j = 0; j < rollouts; j++) {
      let h = handClone(hand);
      h.active.unshift(draw(heap(position, hand)));
      mc_rollout(stats, positionCopy(position), h , opponentHandSize,
        [optionsForPlayers[0].slice(), optionsForPlayers[1].slice()]);
    }
    return aggregate(stats);
  }

  function aggregate(stats) {
    let n = 0,
        x = 0;
    for (let [_, [c, s]] of stats) {
      n += c;
      x += s;
    }
    return [n, x];
  }

  function mc_choose22(position, hand, opponentHandSize, optionsForPlayers, offer22, rollouts) {
    let stats = new Map();
    for (let i = 0; i < 2; i++) {
      let picked = offer22.slice();
      picked.splice(0, 0, ...picked.splice(i * 2, 2));
      let p = positionCopy(position);
      move_offer22(1, p, {active: picked.slice()}, picked);
      stats.set(picked.slice(0, 2).join(''), rolloutForChoice(p, hand, opponentHandSize, optionsForPlayers, rollouts));
    }
    return bestStats(stats);
  }


  // -------------------- Convenience functions --------------------

  function mkOff(s) {
    return s.split('');
  }


  function mkHand(s) {
    return {active: mkOff(s)};
  }

  // us, them: string of geisha codes (a-g)
  // prev: string of length 7 of -0+ for previous scores which are stored in the optional [2]
  function mkPos(us, them, prev) {
    let pos = initialPosition();
    for (let i = 0; i < 2; i++) {
      for (let k of [us, them][i].split('')) {
        pos[k][i]++;
      }
    }
    if (prev) {
      for (let i = 0; i < 7; i++) {
        pos[String.fromCharCode(97 + i)][2] = ({'-': -1, '0': 0, '+': 1})[prev[i]];
      }
    }
    return pos;
  }

  // command string of (r)eserve, (d)iscard, offer(3), offer(2)2
  function mkOpt(s) {
    return s.split('').map(c =>
      ({'r': random_reserve, 'd': random_discard, '2': random_offer22, '3': random_offer3})[c]);
  }
//})();
