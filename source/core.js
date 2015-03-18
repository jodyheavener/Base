let Base = class {

  // constructor
  // Responsible for setting up Base class
  //
  // configuration | Object
  //   name    | String  | Name of App
  //   version | Integer | Version of App
  //
  constructor(configuration) {
    // Version of Base Framework
    this.BASE_VERSION = "0.0.1";

    // Add all configuration options to instance
    if (typeof configuration === "object") {
      Object.keys(configuration).forEach(key => {
        this[key] = configuration[key];
      });
    };
  }

}

Base.Class = class {

  // constructor
  // Responsible for setting up BaseClass class
  //
  // configuration | Object
  //   element    | String   | Selector passed to jQuery object, used in Views
  //   events     | Object   | Events for delegation to the event emitter
  //   initialize | function | Init method called after class has been super'd
  //   _          | any      | Other members/methods to be bound to the instance
  //
  constructor(configuration) {
    // Add all configuration options to instance
    if (typeof configuration === "object") {
      Object.keys(configuration).forEach(key => {
        this[key] = configuration[key];
      });
    };

    // If this.element isn't set then we need to create a jQuery
    // object that can act as an event emitter
    if (this.element == null) {
      this.emitter = $({});
    // But if it is set, add it to a jQuery object so it can be
    // the event receiver
    } else {
      this.element = $(this.element);
    }

    // Use the this.events object to parse delegate events to
    // the event emitter
    if (typeof this.events === "object") {
      Object.keys(this.events).forEach(caller => {
        this.addEvent(caller);
      });
    }

    // At the very least, if no events were added, create an empty events member
    // so we can create new ones in the future
    if (this.events == null)
      this.events = {};

    // This class will always be super'd, and its parent can optionally have an
    // initialize method to be called after it has been super'd
    if (this.initialize != null)
      this.initialize.call(this);
  }

  // addEvent
  // Handles parsing and delegating of incoming events
  //
  // called | String | Event and optional child selector to parse and create new event with
  //
  addEvent(caller) {
    let parameters = {};
    let callback = this.events[caller];
    let assignee = callback.substr(callback.indexOf(' ') + 1);

    // Check if the callback contains a callback
    // Set parameter.callback as text node before first space in case it does
    parameters.callback = callback.substr(0, callback.indexOf(' '));

    // If it does, add it as a parameter.assignee
    if (parameters.callback.length && typeof this[assignee] === "object") {
      parameters.assignee = this[assignee];
    // If not, reset parameter.callback to full callback value
    } else {
      parameters.callback = callback;
    }

    // Check if the caller contains a selector
    // Set parameter.name as text node before first space in case it does
    parameters.name = caller.substr(0, caller.indexOf(' '));

    // If it does, add it as a parameter.selector
    if (parameters.name.length && this.element != null) {
      parameters.selector = caller.substr(caller.indexOf(' ') + 1);
    // If not, reset parameter.name to full caller value
    } else {
      parameters.name = caller;
    }

    // Send the event and its parameters to the on() method
    if (parameters.assignee || typeof parameters.callback === "function")
      this.on(parameters);
  }

  // on
  // Assigns events to the instance's event emitter using jQuery's on()
  //
  // paremeters | Object
  // * name     | String   | Event to assign to the emitter
  //   selector | String   | Child selector, if emitter is an element
  //   assignee | Object   | Instance to call method from
  // * callback | Function | Callback to be executed when event is emitted
  //
  on(parameters) {
    console.log(parameters);
    // Determine which emitter to assign event to
    let emitter = this.element || this.emitter;

    // Determine which instance to call event from
    let instance = parameters.assignee || this;

    // Use jQuery on() to assign callback to the given event, passing in
    // the designated instance
    emitter.on(parameters.name, parameters.selector, function(event, params){
      instance[parameters.callback].apply(instance, [params]);
    });
  }

  // off
  // Removes events from the instance's event emitter using jQuery's off()
  //
  // paremeters | Object
  // * name     | String   | Event to remove from the emitter
  //   selector | String   | Child selector, if emitter was an element
  //   assignee | String   | Instance to call method from
  // * callback | Function | Callback executed when event was emitted
  //
  off(parameters) {
    // Determine which emitter to remove event from
    let emitter = this.element || this.emitter;

    // Determine which instance the event was called from
    let instance = this[parameters.assignee] || this;

    // Use jQuery on() to assign callback to the given event, passing in
    // the class's instance
    emitter.on(parameters.name, parameters.selector, function(){
      instance[parameters.callback].call(instance);
    });
  }

  trigger(eventName, extraParameters) {
    // Determine which emitter to trigger event on
    let emitter = this.element || this.emitter;

    // Trigger the event, emitting it
    emitter.trigger(eventName, extraParameters);
  }

}

