const START = 0;
const DATA = 1;
const END = 2;

function interval(type, data) {
  if (type === START) {
    const sink = data;

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
    sink(0, talkback);
    return dispose;
  }
}

function map(transform, source) {
  return function mapSource(type, data) {
    if (type === START) {
      const sink = data;

      let sourceTalkback = undefined;
      const mapSink = (t, d) => {
        if (t === START) {
          sourceTalkback = d;
          const mapTalkback = sourceTalkback;
          return sink(0, mapTalkback);
        }
        if (t === DATA) {
          return sink(t, transform(d));
        }
        return sink(t, d);
      };
      return source(START, mapSink);
    }
  };
}

function take(max, source) {
  return function takeSource(type, data) {
    if (type === START) {
      const sink = data;

      let taken = 0;
      let sourceTalkback = undefined;
      const takeSink = (t, d) => {
        if (t === START) {
          sourceTalkback = d;
          const takeTalkback = sourceTalkback;
          return sink(0, takeTalkback);
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
const takeMapInterval = take(6, mapInterval);
const dispose = takeMapInterval(START, drain());

// setTimeout(() => {
//   dispose();
// }, 6500);
