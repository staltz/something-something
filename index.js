const START = 0;
const DATA = 1;
const END = 2;

function intervalObservable(period) {
  return function intervalSource(start, sink) {
    if (start !== START) return;
    let i = 0;
    const handle = setInterval(() => {
      sink(DATA, i++);
    }, period);
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
  };
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

function fromIterator(iter) {
  return function iteratorSource(start, sink) {
    if (start !== START) return;
    function talkback(t, d) {
      if (t === DATA) {
        const res = iter.next();
        if (res.done) {
          sink(END);
        } else {
          sink(DATA, res.value);
        }
      }
    }
    sink(START, talkback);
  };
}

function map(transform, source) {
  return function mapSource(start, sink) {
    if (start !== START) return;
    const mapSink = (t, d) => {
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
    const filterSink = (t, d) => {
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
    const accumulateSink = (t, d) => {
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
        return sink(t, d);
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
  };
}

function merge(...sources) {
  return function mergeSource(start, sink) {
    if (start !== START) return;
    for (let source of sources) {
      source(START, sink);
    }
  };
}

function combine(...sources) {
  return function combineSource(start, sink) {
    if (start !== START) return;
    const EMPTY = {};
    const n = sources.length;
    let Nn = n;
    let Nc = n;
    const vals = Array(n);
    const talkback = (t, d) => {
      if (t === END) {
        sourceTalkbacks.forEach(fn => fn && fn(END));
      }
    };
    const sourceTalkbacks = Array(n);
    if (n === 0) {
      sink(DATA, []);
      sink(END);
      return;
    }
    sources.forEach((source, i) => {
      vals[i] = EMPTY;
      function combineSink(type, data) {
        if (type === START) {
          sourceTalkbacks[i] = data;
          return sink(START, talkback);
        }
        if (type === DATA) {
          const _Nn = !Nn ? 0 : vals[i] === EMPTY ? --Nn : Nn;
          vals[i] = data;
          if (_Nn === 0) {
            const arr = Array(n);
            for (let j = 0; j < n; ++j) arr[j] = vals[j];
            sink(DATA, arr);
          }
          return;
        }
        if (type === END) {
          if (--Nc === 0) {
            sink(END);
          }
          return;
        }
        sink(type, data);
      }
      source(START, combineSink);
    });
  };
}

function observe() {
  let handle;
  return function drainSink(type, data) {
    if (type === START) {
      // const source = data;
      // handle = setTimeout(() => {
      //   source(DATA); // send a message upstream
      // }, 4500);
      return;
    } else if (type === DATA) {
      console.log(data);
      return;
    } else if (type === END) {
      // if (handle) {
      //   clearTimeout(handle);
      // }
    }
  };
}

function suck(operation) {
  let source;
  return function suckSink(type, data) {
    if (type === START) {
      source = data;
      source(DATA);
    } else if (type === DATA) {
      operation(data);
      setTimeout(() => {
        source(DATA);
      }, 1000);
    } else if (type === END) {
      // just don't bother anymore
    }
  };
}

// const as = intervalObservable(100);
// const bs = filter(x => x > 0, intervalObservable(400));
// const cs = map(arr => arr.join(','), combine(as, bs));
// const ds = take(6, cs);
// const dispose = ds(START, observe());

const as = fromIterator([10, 20, 30, 40].entries());
const bs = map(arr => arr[1] * 0.1, as);
bs(START, suck(x => console.log(x)));

// setTimeout(() => {
//   dispose();
// }, 6500);
