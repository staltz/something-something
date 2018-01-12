function interval(type, data) {
  if (type === 0) {
    const sink = data;

    let i = 0;
    const handle = setInterval(() => {
      sink(1, i++);
    }, 1000);
    const dispose = () => {
      clearInterval(handle);
    };
    function talkback(t, d) {
      if (t === 1) {
        i = 0;
      } else if (t === 2) {
        dispose();
      }
    }
    sink(0, talkback);
    return dispose;
  }
}

function map(transform, source) {
  return function mapSource(type, data) {
    if (type === 0) {
      const sink = data;

      let sourceTalkback = undefined;
      const mapSink = (t, d) => {
        if (t === 0) {
          sourceTalkback = d;
          const mapTalkback = sourceTalkback;
          return sink(0, mapTalkback);
        }
        if (t === 1) {
          return sink(t, transform(d));
        }
        return sink(t, d);
      };
      return source(0, mapSink);
    }
  };
}

function take(max, source) {
  return function takeSource(type, data) {
    if (type === 0) {
      const sink = data;

      let taken = 0;
      let sourceTalkback = undefined;
      const takeSink = (t, d) => {
        if (t === 0) {
          sourceTalkback = d;
          const takeTalkback = sourceTalkback;
          return sink(0, takeTalkback);
        }
        if (t === 1 && ++taken === max) {
          sink(t, d);
          sink(2);
          if (sourceTalkback) {
            sourceTalkback(2);
          }
          return;
        }
        return sink(t, d);
      };
      return source(0, takeSink);
    }
  };
}

function drain() {
  let handle;
  return function drainSink(type, data) {
    if (type === 0) {
      const source = data;
      handle = setTimeout(() => {
        source(1); // send a message upstream
      }, 4500);
      return;
    } else if (type === 1) {
      console.log(data);
      return;
    } else if (type === 2) {
      if (handle) {
        clearTimeout(handle);
      }
    }
  };
}

const mapInterval = map(x => x * 10, interval);
const takeMapInterval = take(6, mapInterval);
const dispose = takeMapInterval(0, drain());

// setTimeout(() => {
//   dispose();
// }, 6500);
