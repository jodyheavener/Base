Base.Class = class {

  /**
   * Constructor for setting up Base.Class instance
   * This class is meant to be extended in to all classes
   * @param    *  {Object}      configuration  Instance configuration
   *              {Object}      ^.events       Events to delegate within the instance
   *              {Function}    ^.initialize   Method to call once instance is set up.
   *                                           Must be called from extending instance.
   *              {Any}         ^.*            Other members/methods to be bound to the instance
   * @returns     {Base.Class}                 The class instance
   */
  constructor(configuration) {
    // Add all configuration members and methods to instance
    Object.keys(configuration).forEach(key => {
      this[key] = configuration[key];
    });
  };

};

/**
 * Internal reference to the events bound to the instance
 * @note I don't think this is a great idea, since two events with the same
 *       name will cancel each other out. Fix this!
 */
Base.Class.prototype.instanceEvents = {};

/**
 * Internal reference to the events bound to the instance
 * @returns  {Boolean}  Does instance have a valid HTMLElement?
 */
Base.Class.prototype.hasElement = function() {
  return this.element && this.element instanceof HTMLElement;
};

/**
 * Parses this.events and delegates events across this and any assigned instances
 * @note Although managed here, this method needs to be called by the extending
 *       instance so it can delegate to the most up to date event element (Views)
 */
Base.Class.prototype.delegateEvents = function() {
  // Bail if no events
  if (!this.events) return;

  // Iterate through this.events
  Object.keys(this.events).forEach(caller => {
    let eventName, element, method, assignee, selector, instance;

    eventName = caller.substr(0, caller.indexOf(" "));
    element   = this.element;
    method    = this.events[caller];
    assignee  = this.events[caller].substr(0, this.events[caller].indexOf(" "));

    // Find out if the event contains a selector. If it does, reasign the event element
    // to a child of the instance element
    if (eventName.length) {
      selector = caller.substr(caller.indexOf(" ") + 1);
      element  = element.querySelectorAll(caller.substr(caller.indexOf(" ") + 1));
    } else {
      eventName = caller;
    };

    // Find out if the event method should executed from the current instance,
    // or assigned to a different instances (which is a member of the current one)
    instance = this;
    if (assignee.length) {
      method = this.events[caller].substr(0, this.events[caller].indexOf(" "));
      instance = this[this.events[caller].substr(this.events[caller].indexOf(" ") + 1)];
    };

    // If we have a valid instance element and the event name is found within
    // the array of DOM events, bind that that event to the element
    if (this.hasElement && Base.prototype._.domEvents.indexOf("on" + eventName) !== -1) {
      Base.prototype._.forElements.call(this, {
        elements: element,
        execute: (element) => {
          element.addEventListener(eventName, (event => {
            instance[method].apply(instance, [event, event.detail]);
          }));
        }
      });
    // If the event is not in the list of DOM elements, the event should be bound to
    // the instance and can be called with this.trigger()
    } else {
      this.instanceEvents[eventName] = instance[method];
    };
  });
};

/**
 * Parses this.events and undelegates events across this and any assigned instances
 * @see Base.Class.delegateEvents, but take not of comments within this method
 */
Base.Class.prototype.undelegateEvents = function(){
  if (!this.events) return;

  Object.keys(this.events).forEach(caller => {
    let eventName, element, method, assignee, selector, instance;

    eventName = caller.substr(0, caller.indexOf(" "));
    element   = this.element;
    method    = this.events[caller];
    assignee  = this.events[caller].substr(0, this.events[caller].indexOf(" "));

    if (eventName.length) {
      selector = caller.substr(caller.indexOf(" ") + 1);
      element  = element.querySelectorAll(caller.substr(caller.indexOf(" ") + 1));
    } else {
      eventName = caller;
    };

    instance = this;
    if (assignee.length) {
      method = this.events[caller].substr(0, this.events[caller].indexOf(" "));
      instance = this[this.events[caller].substr(this.events[caller].indexOf(" ") + 1)];
    };

    if (this.hasElement && Base.prototype._.domEvents.indexOf("on" + eventName) !== -1) {
      Base.prototype._.forElements.call(this, {
        elements: element,
        execute: (element) => {
          // Using removeEventListener instead of addEventListener
          element.removeEventListener(eventName, (event => {
            instance[method].apply(instance, [event, event.detail]);
          }));
        }
      });
    } else {
      // Nullify the event name within this.instanceEvents so it cant be triggered
      this.instanceEvents[eventName] = null;
    };
  });
};

/**
 * Triggers a named event on the instance or its element
 * @param    *  {Object|String}  parameters  Function parameters or event name
 *              {String}         ^.name      Event to trigger
 *              {Object}         ^.data      Data to pass to the method
 * @note        If no data is being sent to the executed method, parameters can
 *              just be a string equal to the event name
 */
Base.Class.prototype.trigger = function(parameters){
  if (!this.events) return;

  let eventName = parameters.name || parameters;

  // If we have a valid instance element and the event name is found within
  // the array of DOM events, emit the event as a CustomEvent
  if (this.hasElement && Base.prototype._.domEvents.indexOf("on" + eventName) !== -1) {
    let event = undefined;

    // Support cross-browser CustomEvents
    if (window.CustomEvent) {
      event = new CustomEvent(eventName, { detail: parameters.data });
    } else {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent(eventName, true, true, parameters.data);
    };

    this.element.dispatchEvent(event);
  // If the event is not in the list of DOM elements, the method within
  // this.instanceEvents by event name is called
  } else {
    this.instanceEvents[eventName].call(this, parameters.data);
  };
};
