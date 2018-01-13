const START = 0;
const DATA = 1;
const END = 2;

function interval(start, sink) {
  if (start !== START) return;
    let i = 0;
    const handle = setInterval(() => {
      sink(DATA, i++);
    }, 1000);
    const dispose = () => {
      clearInterval(handle);
    };
    function talkback(t, d) {
      if (t === DATA) {
        i = 0;
      } else if (t === END) {
        dispose();
      }
    }
    sink(START, talkback);
    return dispose;
  }

function fromArray(arr) {
  return function arrayStream(start, sink) {
    if (start !== START) return;
      for (let x of arr) {
        sink(DATA, x);
      }
      sink(END);
  };
}

function map(transform, source) {
  return function mapSource(start, sink) {
    if (start !== START) return;
      let sourceTalkback = undefined;
      const mapSink = (t, d) => {
        if (t === START) {
          sourceTalkback = d;
          const mapTalkback = sourceTalkback;
          return sink(START, mapTalkback);
        }
        if (t === DATA) {
          return sink(t, transform(d));
        }
        return sink(t, d);
      };
      return source(START, mapSink);
  };
}

function filter(condition, source) {
  return function filterSource(start, sink) {
    if (start !== START) return;
      let sourceTalkback = undefined;
      const filterSink = (t, d) => {
        if (t === START) {
          sourceTalkback = d;
          const filterTalkback = sourceTalkback;
          return sink(START, filterTalkback);
        }
        if (t === DATA) {
          if (condition(d)) {
            return sink(t, d);
          }
          return;
        }
        return sink(t, d);
      };
      return source(START, filterSink);
  };
}

function accumulate(reducer, seed, source) {
  return function accumulateSource(start, sink) {
    if (start !== START) return;
      let state = seed;
      let sourceTalkback = undefined;
      const accumulateSink = (t, d) => {
        if (t === START) {
          sourceTalkback = d;
          const accumulateTalkback = sourceTalkback;
          return sink(START, accumulateTalkback);
        }
        if (t === DATA) {
          state = reducer(state, d);
          return sink(t, state);
        }
        return sink(t, d);
      };
      return source(START, accumulateSink);
  };
}

function take(max, source) {
  return function takeSource(start, sink) {
    if (start !== START) return;
      let taken = 0;
      let sourceTalkback = undefined;
      const takeSink = (t, d) => {
        if (t === START) {
          sourceTalkback = d;
          const takeTalkback = sourceTalkback;
          return sink(START, takeTalkback);
        }
        if (t === DATA && ++taken === max) {
          sink(t, d);
          sink(END);
          if (sourceTalkback) {
            sourceTalkback(END);
          }
          return;
        }
        return sink(t, d);
      };
      return source(START, takeSink);
    }
  };
}

function drain() {
  let handle;
  return function drainSink(type, data) {
    if (type === START) {
      const source = data;
      handle = setTimeout(() => {
        source(DATA); // send a message upstream
      }, 4500);
      return;
    } else if (type === DATA) {
      console.log(data);
      return;
    } else if (type === END) {
      if (handle) {
        clearTimeout(handle);
      }
    }
  };
}

const mapInterval = map(x => x * 10, interval);
const filterMapInterval = filter(x => x > 0, mapInterval);
const takeFilterMapInterval = take(6, filterMapInterval);
const dispose = takeFilterMapInterval(START, drain());

// setTimeout(() => {
//   dispose();
// }, 6500);
