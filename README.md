# Base

### Ideology

One of the core values with Base is that each class and method can be instantiated with an object, meaning there is no order of declaration for arguments, and there is no limit to the number of arguments that can be passed in.

### dataRoute format

Base introduces a new way of traversing a Javascript object by using a simple string format. It can be used with Objects and Arrays and is used in various areas throughout Base. The primary idea is to use _spaces_ to access a value, and _colons_ to access indexes.

That means `"traversing"` becomes `["traversing"]`.

And `"traversing:3 something"` becomes `["traversing"][3]["something"]`.

### Object.observe

In order to listen to Base.Set dataset changes I'm taking a note from ES7 and using the fantastic [Object.observe polyfill](https://github.com/MaxArt2501/object-observe) by Massimo Artizzu. It's really great. As a [wonderful] side effect, `Object.observe` is available globally. Use it!

**Example usage:**

```
Object.observe(myObject, function(changeEvents){
  changeEvents.forEach(function(changeEvent){
    ...
  });
});
```

### Base

`Base` is the core class that contains the framework's sub-classes.

**Notes:**

* This class does not need to be instantiated to use the framework; instead, it keeps a collection of internal helper methods located at `Base._`.
* Perhaps in the future this class could be used for global values, caching, or versioning.

**Methods and members:**

##### constructor

_Returns_ `Base` | The class instance

##### _.dataRoute

Parses a dataRoute formatted string to extract a value from an object

`String` | `route` | _Required_ - String path to parse

`Object` | `target` | _Required_ - Object to extract the path from

##### _.domParser

Instantiated DOMParser; used for template string parsing in Views

##### _.domEvents

All browser DOM events; used for determining if event name is DOM event or custom event when delegating events in Base.Class

_Returns_ `Array` | List of browser DOM events

##### _.forElements

Allows us to execute an HTMLElement's method on one element or a Nodelist

`String|Array` | `elements` | _Required_ - Elements to execute the function on

`Function` | `execute` | _Required_ - Function to execute on the elements

### Base.Class

`Base.Class` is the core class that contains the framework's sub-classes.

**Methods & Members:**

##### constructor

`Object` | `events` | Events to delegate within the instance

`Method` | `initialize` | Method to call once instance is set up

`Any` | `*` | Other members/methods to be bound to the instance

_Returns_ `Base.Class` | The class instance

##### delegateEvents

Parses this.events and delegates events across this and any assigned instances

##### undelegateEvents

Parses this.events and undelegates events across this and any assigned instances

##### trigger

Triggers a named event on the instance or its element

`String` | `name` | _Required_ - Event to trigger

`Object` | `data` | Data to pass to the method

_Note:_ If no data is being sent to the executed method, the parameters object can just be a string equal to the event name

##### hasElement

Checks if `this.element` exists and is and instance of `HTMLElement`

_Returns_ `Boolean` | Does the instance have a valid HTMLElement?

##### instanceEvents

Internal reference to the events bound to the instance

### Base.View

`Base.View` is designed to handle a given element in the DOM.

**Methods and members:**

##### constructor

`HTMLElement` | `element` | _Required_ - The View's element; Only required if `template` is unset

`String|Function` | `template` | Template to be parsed and returned in `render()`

`String|Number` | `id` | Set identifier. If left unset will default to stacking order of `Base.views`

_Returns_ `Base.View` | The class instance

##### setupView

Sets up the view for usage, including setting the ID attribute, delegating events, and initializing

##### render

`String|Function` | `template` | Template to be parsed and returned. If left unset will default to this.template

`Object` | `data` | Data to be passed to the template, if a function

`Function` | `callback` | Function to be executed once render is complete

_Returns_ `HTMLElement` | The newly created this.element

##### destroy

`Boolean` | `removeElement` | If the view's element should also be removed

_Note:_ The parameters object can also be a boolean to set `removeElement`

**Example usage:**

Basic example using `element`.

```
var myView = new Base.View({

  element: document.body,

  events: {
    "click": "pageClicked"
  },

  pageClicked: function() {
    console.log("Page was clicked");
  }

});
```
Basic example using `template`.

```
var myView = new Base.View({

  template: "<div class=\"my-element\"><p>Hey</p></div>",

  events: {
    "hover .some-element": "someElementHovered"
  },

  someElementHovered: function() {
    console.log("Some element was hovered");
  },

});

// myView.element will be .my-element after render
document.body.appendChild(myView.render());
```
