Base.Class = class {

  /**
   * Constructor for setting up Base.Class instance
   * @param    *  {Object}    configuration  Class configuration
   *              {Object}    ^.events       Events for delegation to the event emitter
   *              {Function}  ^.initialize   Init method called after class has been super'd
   *              {Any}       ^.*            Other members/methods to be bound to the instance
   * @returns     {Object}                   The class instance
   */
  constructor(configuration) {
    // Parameter check
    if (typeof configuration !== "object")
      console.error("Base.Class.constructor `configuration` is required and must be of type Object");
    if (configuration.events != null && typeof configuration.events !== "object")
      console.error("Base.Class.constructor `configuration.events` must be of type Object");
    if (configuration.initialize != null && typeof configuration.initialize !== "function")
      console.error("Base.Class.constructor `configuration.initialize` must be of type Function");

    // Add all configuration options to instance
    Object.keys(configuration).forEach(key => {
      this[key] = configuration[key];
    });

    // If this.element isn't set then we need to create a jQuery
    // object that can act as an event emitter
    // this.element should be set in a View instance
    if (this.element == null) {
      this.emitter = $({});
    // But if it is set, add it to a jQuery object so it can be
    // the event receiver
    } else {
      this.element = $(this.element);
    }

    // Use the this.events object to parse delegate events to
    // the event emitter
    Object.keys(this.events).forEach(caller => {
      this.addEvent(caller);
    });

    // At the very least, if no events were added, create an empty events member
    // so we can create new ones in the future
    if (this.events == null)
      this.events = {};

    // This class will always be super'd, and its parent can optionally have an
    // initialize method to be called after it has been super'd
    if (this.initialize != null)
      this.initialize.call(this);
  }

  /**
   * Handles parsing and delegating of incoming events
   * @param    *  {String}  caller  Event and optional child selector to create new event with
   * @returns     {Void}
   */
  addEvent(caller) {
    // Parameter check
    if (typeof caller !== "string")
      console.error("Base.Class.addEvent `caller` is required and must be of type String");

    let parameters = {};
    let callback = this.events[caller];
    let assignee = callback.substr(callback.indexOf(" ") + 1);

    // Check if the callback contains a callback
    // Set parameter.callback as text node before first space in case it does
    parameters.callback = callback.substr(0, callback.indexOf(" "));

    if (parameters.callback.length && typeof this[assignee] !== "object") {
      console.error("Base.Class.addEvent \"" + caller + "\" event has unknown assignee \"" + assignee + "\".");
    // If it does, add it as a parameter.assignee
    } else if (parameters.callback.length && typeof this[assignee] === "object") {
      parameters.assignee = this[assignee];
    // If not, reset parameter.callback to full callback value
    } else {
      parameters.callback = callback;
    }

    // Check if the caller contains a selector
    // Set parameter.name as text node before first space in case it does
    parameters.name = caller.substr(0, caller.indexOf(" "));

    // If it does, add it as a parameter.selector
    if (parameters.name.length && this.element != null) {
      parameters.selector = caller.substr(caller.indexOf(" ") + 1);
    // If not, reset parameter.name to full caller value
    } else {
      parameters.name = caller;
    }

    // Send the event and its parameters to the on() method
    if (parameters.assignee || typeof this[parameters.callback] === "function")
      this.on(parameters);
  }

  /**
   * Assigns events to the instance's event emitter using jQuery's on()
   * @param    *  {Object}  parameters  Event parameters
   *           *  {String}  ^.name      Event to assign to the emitter
   *              {String}  ^.selector  Child selector, if emitter is an element
   *              {Object}  ^.assignee  Instance to call method from
   *           *  {String}  ^.callback  Callback to be executed when event is emitted
   * @returns     {Void}
   */
  on(parameters) {
    // Parameter check
    if (typeof parameters !== "object")
      console.error("Base.Class.on `parameters` is required and must be of type Object");
    if (typeof parameters.name !== "string")
      console.error("Base.Class.on `parameters.name` is required and must be of type String");
    if (parameters.selector != null && typeof parameters.selector !== "string")
      console.error("Base.Class.on `parameters.selector` must be of type String");
    if (parameters.assignee != null && typeof parameters.assignee !== "object")
      console.error("Base.Class.on `parameters.assignee` must be of type Object");
    if (typeof parameters.callback !== "string")
      console.error("Base.Class.on `parameters.callback` is required and must be of type String");

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

  /**
   * Removes events from the instance's event emitter using jQuery's off()
   * @param    *  {Object}    parameters  Event parameters
   *           *  {String}    ^.name      Event to remove from the emitter
   *              {String}    ^.selector  Child selector, if emitter was an element
   *              {Object}    ^.assignee  Instance method was called from
   *           *  {Function}  ^.callback  Callback executed when event was emitted
   * @returns     {Void}
   */
  off(parameters) {
    // Parameter check
    if (typeof parameters !== "object")
      console.error("Base.Class.off `parameters` is required and must be of type Object");
    if (typeof parameters.name !== "string")
      console.error("Base.Class.off `parameters.name` is required and must be of type String");
    if (parameters.selector != null && typeof parameters.selector !== "string")
      console.error("Base.Class.off `parameters.selector` must be of type String");
    if (parameters.assignee != null && typeof parameters.assignee !== "object")
      console.error("Base.Class.off `parameters.assignee` must be of type Object");
    if (typeof parameters.callback !== "string")
      console.error("Base.Class.off `parameters.callback` is required and must be of type String");

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


  /**
   * Triggers an event from the instance's event emitter
   * @param    *  {String}  eventName        Name of event to trigger
   * @param       {Array}   extraParameters  Any extra parameters to send from the trigger
   * @returns     {Void}
   */
  trigger(eventName, extraParameters) {
    // Parameter check
    if (typeof eventName !== "string")
      console.error("Base.Class.trigger `eventName` is required and must be of type String");
    if (extraParameters != null && typeof extraParameters !== "object")
      console.error("Base.Class.trigger `extraParameters` must be of type Object");

    // Determine which emitter to trigger event on
    let emitter = this.element || this.emitter;

    // Trigger the event, emitting it
    emitter.trigger(eventName, extraParameters);
  }

}
