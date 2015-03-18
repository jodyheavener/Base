Base.View = class extends Base.Class {

  /**
   * Constructor for setting up Base.View instance
   * @super       Base.Class
   * @param    *  {Object}         configuration  Instance configuration
   *           *  {String|Object}  ^.element      Selector passed to jQuery instance
   *              {String|Number}  ^.id           Identifier assigned to the view; if left
   *                                              undefined, will default to index position
   */
  constructor(configuration) {
    // Parameter check
    if (typeof configuration !== "object")
      console.error("Base.View.constructor `configuration` is required and must be of type Object");
    if (typeof configuration.element !== "string" && typeof configuration.element !== "object")
      console.error("Base.View.constructor `configuration.element` must be of type String or Object");
    if (configuration.id != null && typeof configuration.id !== "string" && typeof configuration.id !== "number")
      console.error("Base.View.constructor `configuration.id` must be of type String or Number");

    // Super BaseClass constructor
    super.constructor(configuration);

    // Set up the View's indentifier; if one was not set, use the View's
    // index position in the Base.views object
    this.id = this.id || Object.keys(Base.views).length + 1;

    // Attach the View identifier to its element
    this.element.attr("data-view", this.id);

    // Add the View to the Base.views object
    Base.views[this.id] = this;
  }

  /**
   * Destroys the current View instance
   * @param       {Object|String}  parameters    Parameters to destroy view
   *              {Boolean}        ^.element     Should destroy also remove the element?
   *              {String}         ^.transition  Class name to be applied for when a transition is
   *                                             desired before removing an element.
   *                                             Requires ^.element parameter to be true.
   */
  destroy(parameters) {
    // Parameter check
    if (parameters != null && typeof parameters !== "object" && typeof parameters !== "string")
      console.error("Base.View.destroy `parameters` must be of type Object");
    if (parameters.element != null && typeof parameters.element !== "boolean")
      console.error("Base.View.destroy `parameters.element` must be of type Boolean");
    if (parameters.transition != null && typeof parameters.transition !== "String")
      console.error("Base.View.destroy `parameters.transition` must be of type String");

    let
        // removeView
        // Conditionally removes the data-view attribute from the View's element
        // Removes the View from the Base.views object
        //
        removeView = function() {
          // If the element hasn't been removed, remove its data-view attribute
          if (this.element != null)
            this.element.removeAttr("data-view");

          // Remove the View from the Base.views object
          delete Base.views[this.id];
        },

        // removeElement
        // Remove the View's element from the DOM and resets this.element
        //
        removeElement = function(callback) {
          // Remove the View's element from the DOM
          this.element.remove();

          // Reset this.element
          this.element = undefined;

          // If a callback is provided, execute it
          if (callback != null)
            callback.call(this);
        }

    // If paremeters.element is truthy, we need to first remove the View's
    // element from the DOM before removing the View itself
    if (parameters != null && parameters.element === true) {
      // If parameters.transition is set, we need to apply the string as a class
      // to the View's element (with the assumption it will trigger a
      // transition), and then wait for a transitionend event to fire before
      // removing the View's element and the View
      if (parameters.transition) {
        // Set up a transitionend event handler
        this.on({
          name: "transitionend",
          callback: function(){
            removeElement.apply(this, [function(){
              removeView.call(this);
            }]);
          }
        });

        // Then apply the class to trigger the transitionend event
        this.element.addClass(parameters.transition);
      } else {
        // Otherwise, just remove the View's element and then remove the View
        removeElement.apply(this, [function(){
          removeView.call(this);
        }]);
      }
    // Otherwise, just remove the View
    } else {
      removeView.call(this);
    };
  }

}

// Give the Base class a views object to store references
// to all views on the page
Base.views = {};

/**
 * Extends the Base.View class as a method of the Base class
 * @param    *  {Object}   configuration  @see Base.View.constructor
 * @returns     {Object}                  The Base.View instance
 */
Base.prototype.addView = function(configuration) {
  return new Base.View(configuration);
}

/**
 * Executes the destroy method of a Base.View instance, by View ID
 * @param    *  {String|Object}  parameters
 *              {String}                     Identifier of the View to destroy
 *              {Object}                     @see Base.View.constructor
 * @returns     {String}                     ID of the View destroyed
 */
Base.prototype.destroyView = function(parameters) {
  Base.views[parameters.id || parameters].destroy(parameters);
  return parameters.id || parameters;
}
