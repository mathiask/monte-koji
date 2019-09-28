//(function() {

  // Board is an object indexed a...g with a pair of numbers indicating "our" played cards and
  // "their" played cards for the fiven Geisha.
  function initialPosition() {
    return {a: [0,0], b: [0,0], c: [0,0], d: [0,0], e: [0,0], f: [0,0], g: [0,0]};
  }

  let geisha = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  let geishaValues = {a: 2, b: 2, c: 2, d: 3, e: 3, f: 4, g: 5};

  // Compute heap for position and hand, where a hand is of the form:
  // { active: a list of geisha keys, e.g. ['a', 'b', 'b', 'g']
  //   discarded: an optional list of two discarded cards
  // }
  // The reserved card is not represented as we play it open on the board
  // (the random rollout opponent ignores it anyway.)
  function heap(pos, hand) {
    let result = {};
    for (k in geishaValues) {
      let p = pos[k];
      result[k] = geishaValues[k] - p[0] - p[1];
    }
    for (k of hand.active) {
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
    for (k in heap) {
      size += heap[k];
    }
    return size;
  }

  // Draw a random card from heap, chaning the given heap
  function draw(heap) {
    let index = rnd(size(heap));
    for (k in heap) {
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

  // -------------------- Move implementations -------------------

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
    [card1, card2, card3, card4] = cards;
    position[card1][1-player]++;
    position[card2][1-player]++;
    position[card3][player]++;
    position[card4][player]++;
    removeCard(hand, card1);
    removeCard(hand, card2);
    removeCard(hand, card3);
    removeCard(hand, card4);
  }

  // -------------------- Random player choice functions -------------------

  // All choice functions modify position, hand.

  function random_reserve(player, position, hand) {
    let card = hand.active[rnd(hand.active.length)];
    move_reserve(player, position, hand, card);
    return `Reserve ${card}`;
  }

  function random_discard(player, position, hand) {
    let cards = putNCardsToFrontOfHand(hand, 2);
    move_discard(player, position, hand, cards);
    return `Discarding ${cards[0]} and ${cards[1]}`;
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
    return `Offering ${offer.join(' + ')}`
  }


  function random_offer22(player, position, hand) {
    let offer = putNCardsToFrontOfHand(hand, 4);
    move_offer22(player, position, hand, offer);
    return `Offering ${offer.slice(0, 2).join('+')} and ${offer.slice(2, 4).join('+')}`
  }



  // options is an array of choice functions (corresponding to the game, tokens)
  function random_move(player, position, hand, options) {
    let move = options.splice(rnd(options.length), 1);
    return move[0](player, position, hand);
  }

  // -------------------- main -------------------

  let hk = function() {
    return 'TBD...';
  };

  window.hk = hk;
//})();
