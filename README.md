# Base

Overview

* [About Base](#about-base)
* [Changelog](#changelog)

Technical additions

* [Base.Class Events](#baseclass-events)
* [Base.Set Schemas](#baseset-schemas)
* [dataRoute Format](#dataroute-format)
* [Object.observe](#objectobserve)

Classes

* [Base](#base-1)
* [Base.Class](#baseclass)
* [Base.View](#baseview)
* [Base.Set](#baseset)
* [Base.Store](#basestore)

### About Base

I built this "framework" out of personal desire to learn more about Javascript. I wanted to 1) be able to build a complete framework that I could tailor to my needs, 2) get a good start on exploring ECMAScript 6, and 3) build something without any dependencies* (such as jQuery).

Everything about this framework is heavily inspired by Backbone, such as Views and event delegation, mainly because I'm most familiar with it. It isn't as flexible and lacks certain functionality, however everything is built from the ground up, has no dependencies (like jQuery or Underscore), and has a few additions that make it pretty useful. That's what matters most to me.

One of the key things about Base is that each class and method can be instantiated with an object, meaning there is no order of declaration for arguments, and there is no limit to the number of arguments/parameters that can be passed in.

**I need your help.** I want you to tell me what I did wrong, what can be improved, and what could be added to make this a little more stable and well-rounded. Feel free to open an issue if you'd like to send me some feedback.

_\* Technically I'm depending on Massimo Artizzu's Object.observe script, but it's a polyfill so I don't think that counts ;)_

### Changelog

March 22nd 2015 - `v0.0.2` - Initial beta release

### Base.Class Events

`Base.Class` is extended in to all other Base subclasses, meaning events are available to all instances. Events are constructed a lot of like Backbone's events, where custom events are available across all instances, and DOM events are available to `Base.View` instances:

```javascript
events: {
    "click": "somethingClicked",
    "hover .child-element": "childElementHovered",
    "custom-event": "customEventTriggered"
}
```
There is one addition to events that this framework adds; I'm calling it **Method assignment**. By adding another Base instance to your current instance as a member and then naming that member in your event method after a space, the event fired will trigger the method in that assigned instance.

```javascript
var otherView = myApp.addView({
  element: document.body.querySelector(".my-element")[0],

  doSomething: function() {
    console.log("Doing something ok!");
  }
});

var myView = new View({

  otherView: otherView,

  // In this case, doSomething is being assigned to otherView
  // and is being triggered by custom-event
  events: {
    "custom-event": "doSomething otherView"
  }

});
```

### Base.Set Schemas

Schemas in Base are intended to enforce specific structures within datasets. It allows you to search through an object, looking for specific keys and passing their values to a test to see if they match a specific type.

`type` is a `String` that allows you to pass in a named type. By default `string`, `number`, `array`, `object`, `url`, and `timestamp` are built-in types. Alternatively, `type` can be a `Function` that accepts a value and returns a `Boolean`.

`use` is an `Array` that tells the schema where to look in the passed in object to find the data, using the dataRoute format. If the first element in the array doesn't return a value of the specified type, it will go to the next element in the array. `use` can also be a `String` if only one dataRoute is being specified.

`fail` is a `String` or `Function` that assigns its returned value to the name of the schema item key. It does not test for type.

### dataRoute format

Base introduces a new way of traversing a Javascript object by using a simple string format. It can be used with Objects and Arrays and is used in various areas throughout Base. The primary idea is to use _spaces_ to access a value, and _colons_ to access indexes.

That means `"traversing"` becomes `["traversing"]`.

And `"traversing:3 something"` becomes `["traversing"][3]["something"]`.

### Object.observe

In order to listen to Base.Set dataset changes I'm taking a note from ES7 and using the fantastic [Object.observe polyfill](https://github.com/MaxArt2501/object-observe) by Massimo Artizzu. It's really great. As a [wonderful] side effect, `Object.observe` is available globally. Use it!

**Example usage:**

```javascript
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

```javascript
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

```javascript
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

### Base.Set

`Base.Set` is designed to contain a set of data that adheres to a given schema / structure.

**Notes:**

* In the future I would like this class to inherit ES6's Set type

**Methods and members:**

##### constructor

`Object` | `schema` | _Required_ Schema to adhere dataset to

`String|Number` | `id` | Set identifier. If left unset will default to stacking order of Base.sets

_Returns_ `Base.Set` | The class instance

##### typeTests

Object containing collection of functions to test against named types

##### addType

Tests a value for type validation

`String|Function` | `type` | _Required_ Either a named type within this.typeTests, or a Function to test the value against

`Any` | `value` | _Required_ Value to use in the type test

_Returns_ `Boolean` | If the value is of the type

##### add

Attempts to add a value to the this.data dataset, adhering to this.schema

`Any` | `data` | _Required_ Data to attempt to add to the dataset

_Note:_ The parameters object can also be any value to set `data`

##### get

Get a value from the dataset

`String` | `route` | _Required_ dataRoute formatted string

_Returns_ `Any` | Returned value from the dataset

**Example usage:**

Example adding data to a set while adhering to a schema

```javascript
var testPostData = {
  postName: "This is a blog post!",
  postUrl: "http://myblog.com/this-is-a-blog-post",
  shortUrl: "http://myb.log/123",
  postedOn: 123456789,
  tags: ["fancy", "writing"],
  images: [
    "http://myblog.com/images/2015/01/small",
    "http://myblog.com/images/2015/01/medium",
    "http://myblog.com/images/2015/01/large",
    "http://myblog.com/images/2015/01/original"
  ]
};

var postDataSet = new Base.Set({
  schema: {
    "title": {
      type: "string",
      use: "postName"
    },
    "url": {
      type: "url",
      use: ["shortUrl", "postUrl"]
    },
    "date": {
      type: "timestamp",
      use: "postedOn"
    },
    "tags": {
      type: "array",
      use: "tags"
    },
    "image": {
      type: "object",
      use: ["images:2", "images:3"]
    }
  }
});

postDataSet.add(testPostData);
```

### Base.Store

`Base.Store` is designed to manage a collection of Base.Set views.

**Notes:**

* This class does very little at the moment. In the future I would like implement data fetching and data management methods.

**Methods and members:**

##### constructor

`Base.Set` | `*` | A Base.Set instance to attach to the store

_Returns_ `Base.Store` | The class instance

##### observeSets

Performs `Object.observe` on all datasets in the store

##### changeObservation

Fired when a dataset change is observed, triggering the change type's event and passing the change data and the changed Base.Set instance to the executed method

**Example usage:**

Example using the data observation "add" event and event method assignment.

```javascript
var testView = myApp.addView({
  element: document.body.querySelector(".my-element")[0],

  somethingAdded: function(changeEvent) {
    console.log("Something was added!", changeEvent);
  }
});

var myStore = new Base.Store({

  // Base.View added as a member of this instance
  myView: myView,

  // Base.Set added as a member of this instance
  myDataSet: myDataSet,

  events: {
    "add": "somethingAdded myView"
  }

});
```
