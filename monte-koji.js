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
    let index = Math.floor(Math.random() * size(heap));
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

  // The four following moves all modify position and hand.
  // player is always 0 (us) or 1 (them)

  function move_reserveCard(player, position, hand, card) {
    position[card][player]++;
    removeCard(hand, card);
  }

  function removeCard(hand, card) {
    hand.active.splice(hand.active.indexOf(card), 1);
  }
  
  function move_discard(_player, _position, hand, card1, card2) {
    hand.discarded = [card1, card2];
    removeCard(hand, card1);
    removeCard(hand, card2);
  }

  // opponent chose card1
  function move_offer3(player, position, hand, card1, card2, card3) {
    position[card1][1-player]++;
    position[card2][player]++;
    position[card3][player]++;
    removeCard(hand, card1);
    removeCard(hand, card2);
    removeCard(hand, card3);
  }

  // opponent chose card1 and card2
  function move_offer2and2(player, position, hand, card1, card2, card3, card4) {
    position[card1][1-player]++;
    position[card2][1-player]++;
    position[card3][player]++;
    position[card4][player]++;
    removeCard(hand, card1);
    removeCard(hand, card2);
    removeCard(hand, card3);
    removeCard(hand, card4);
  }


  let hk = function() {
    return 'TBD...';
  };

  window.hk = hk;
//})();
