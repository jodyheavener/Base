Base.prototype.views = {};

Base.View = class extends Base.Class {

  /**
   * Constructor for setting up Base.View instance
   * @param    *  {Object}           configuration  Instance configuration
   *           *  {HTMLElement}      ^.element      The View's element
   *                                                Only required if ^.template is unset
   *              {String|Function}  ^.template     Template to be parsed and returned in
   *                                                this.render()
   *              {String|Number}    ^.id           Set identifier. If left unset will default
   *                                                to stacking order of Base.views
   * @returns     {Base.View}                       The class instance
   */
  constructor(configuration) {
    super.constructor(configuration);

    // Indentify and add set to Base.views
    this.id = this.id || Object.keys(Base.prototype.views).length + 1;
    Base.prototype.views[this.id] = this;

    // Only running this.setupView() is this.element is present, because
    // if it's not and this.template is set, running this.render() will
    // also run this.setupView()
    if (this.element)
      this.setupView();
  };

};

/**
 * Sets up the view for usage, including setting the ID attributes
 * delegating events, and initializing
 */
Base.View.prototype.setupView = function() {
  // Add identifier to this.element in the DOM
  this.element.setAttribute("data-view", this.id);

  // Run event delegation
  this.delegateEvents();

  if (this.initialize)
    this.initialize();
};

/**
 * Renders and returns the compiled template
 * @param    *  {Object}           parameters  Function parameters
 *              {String|Function}  ^.template  Template to be parsed and returned.
 *                                             If left unset will default to this.template
 *              {Object}           ^.data      Data to be passed to the template, if a function
 *              {Function}         ^.callback  Function to be executed once render is complete
 * @returns     {HTMLElement}                  The newly created this.element
 */
Base.View.prototype.render = function(parameters) {
  let parsedHTML, template;

  // If a template string or function is specified, use it
  // checking whether or not execute it and pass data to it
  if (parameters.template) {
    if (typeof parameters.template === "function") {
      template = parameters.template(parameters.data);
    } else {
      template = parameters.template;
    }
  // If not, use the instance's template
  } else {
    if (typeof this.template === "function") {
      template = this.template(parameters.data);
    } else {
      template = this.template;
    }
  }

  // Use a DOM Parser to create actualy HTML elements from the template string
  // Extracting the top-most element and assigning it as the view's new element
  parsedHTML = Base.prototype._.domParser.parseFromString(this.template, "text/xml");
  this.element = parsedHTML.children[0];

  // Set up our view and execute the callback if one is supplied
  this.setupView();
  if (parameters.callback)
    parameters.callback();

  return this.element;
};

/**
 * Removes the view's instance, optionally removing the element from the DOM
 * @param    *  {Object|Boolean}   parameters       Function parameters or bool to remove the view element
 *              {Boolean}          ^.removeElement  If the view's element should also be removed
 */
Base.View.prototype.destroy = function(parameters){
  let removeView, removeElement;

  // Function to remove the view instance, it's association with the element,
  // and any events delegated to it
  removeView = function() {
    if (this.element != null){
      this.element.removeAttribute("data-view");
    };

    this.undelegateEvents();
    Base.prototype.views[this.id] = null;
  };

  // Function to remove the element from the DOM
  // @param {Function} executed after the element has been removed
  removeElement = function(callback) {
    this.element.parentNode.removeChild(this.element);
    this.element = undefined;

    if (callback != null)
      callback.call(this);
  };

  // If we're removing the view's element, call removeElement and specify
  // removeView as its callback function
  if (parameters != null && (parameters === true || parameters.removeElement === true)) {
    removeElement.apply(this, [function(){
      removeView.call(this);
    }]);
  // If not, just run removeView
  } else {
    removeView.call(this);
  };
}
