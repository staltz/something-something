**some kind of reactive streams in javascript**

you know how in RxJS an Observer gets data from the Observable, but the Observable cannot get data from the Observer? yeah, what if every Observer would be an Observable and vice-versa?

so basically what that gives you is the possibility of sending a message upstream in the operator pipeline. one of the cool things this enables is being able to reset or poke the source observable to do something.

like in the `index.js` the "interval" observable can be reset. you know how RxJS Observables just tick 0, 1, 2, 3, ad infinitum? what if we could tell the observable to reset that counter? I know I know you can achieve this in other ways, by switch mapping an observable, I know all that stuff.

so this prototype kind of gives you the ability to have bi-directional communication.

it currently supports:
- cold subscription
- sending messages from source to sink
- sending messages from sink to source
- subscription and disposal
- "complete" notification (which in turn will dispose)
- some operators (map and take)

the end goal is to find a way of supporting pull-style APIs on top of a push-based primitive.

poorly explained because it's a prototype and I just wanted to get the idea out and concrete, but above all, I want to hear criticism and feedback and dialogue from people who understand where I'm trying to go. :)

