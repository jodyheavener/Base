let Base = class {

  /**
   * Constructor for setting up Base instance
   * @param       {Object}   configuration  Instance configuration
   *              {Any}      ^.*            Other members/methods to be bound to the instance
   * @returns     {Base}                    The class instance
   * @note        Technically this class does not need to be instantiated for anything to
   *              work. It is simply here so it can house the ._ helpers. Perhaps in the future
   *              this class could be used for global values, caching, or versioning.
   */
  constructor(configuration) {
    // Framework version - need to a find a better way to implement and update this
    this.BASE_VERSION = "0.0.2";

    // Add all configuration members and methods to instance
    if (typeof configuration === "object") {
      Object.keys(configuration).forEach(key => {
        this[key] = configuration[key];
      });
    };
  };

};

/**
 * ._ will contain helpers used throughout the framework
 * @note This might be better off as direct methods of the Base class
 */
Base.prototype._ = {};

/**
 * Parses a string (with a specific format) to extract a value from an object
 * @param    *  {Object}   parameters  Function paramaters
 *           *  {String}   ^.route     Sring path to parse
 *           *  {Object}   ^.target    Object to extract the path from
 * @returns     {Any}                  The value of the object's path parsed from the route
 * @note        In the future I would like to see this a little more well-rounded,
 *              perhaps with conditional routes, built in type evaluation
 */
Base.prototype._.dataRoute = function(parameters) {
  let tokens, route = "";
  // Start by splitting up all spaced text
  tokens = String(parameters.route).split(" ");
  tokens.forEach(token => {
    // Then join it back together, wrapping in brackets and quotation marks
    route = route + "[\"" + token + "\"]";
  });
  // Finally, replace any colon+numbers with cut-off brackets and quotes
  // This regex should probably be /:([0-9]\d*)"/g
  route = route.replace(/:([0-9])"/g, "\"][$1");
  return eval("parameters.target" + route);
};

/**
 * DOM Parser; used for template string parsing in Views
 */
Base.prototype._.domParser = new DOMParser();

/**
 * All browser DOM events; used for determing if event name is DOM event or custom
 * event when delegating events in Base.Class
 * @returns  {Array}  List of browser DOM events
 */
Base.prototype._.domEvents = Object.getOwnPropertyNames(document).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(document)))).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(window))).filter(function(i) {
  return !i.indexOf("on") && (document[i] == null || typeof document[i] == "function");
}).filter(function(elem, pos, self) {
  return self.indexOf(elem) == pos;
});

/**
 * Allows us to execute an HTMLElement's method on one element or a Nodelist
 * @param    *  {Object}        parameters  Function paramaters
 *           *  {String|Array}  ^.elements  Elements to execute the function on
 *           *  {Function}      ^.execute   Function to execute on the elements
 */
Base.prototype._.forElements = function(parameters) {
  if (!parameters.elements.length)
    parameters.elements = [parameters.elements];

  [].forEach.call(parameters.elements, (element) => {
    parameters.execute(element);
  });
};
