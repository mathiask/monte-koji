//(function() {

  // Board is an object indexed a...g with a pair of numbers indicating "our" played cards and 
  // "their" played cards for the fiven Geisha.
  function initialPosition() {
    return {a: [0,0], b: [0,0], c: [0,0], d: [0,0], e: [0,0], f: [0,0], g: [0,0]};
  }

  let geisha = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  let geishaValues = {a: 2, b: 2, c: 2, d: 3, e: 3, f: 4, g: 5};

  // Compute heap for position and hand, where a hand is a list of geisha keys, e.g. ['a', 'b', 'b', 'g']
  function heap(pos, hand) {
    let result = {};
    for (k in geishaValues) {
      let p = pos[k];
      result[k] = geishaValues[k] - p[0] - p[1]; 
    }
    for (k of hand) {
      result[k]--;
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
    throw "Drawing beyond end of heap (should never happen)."
  }

  let hk = function() {
    return 'TBD...';
  };

  window.hk = hk;
//})();
