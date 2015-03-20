let Base = class {

  /**
   * Constructor for setting up Base instance
   * @param    *  {Object}   configuration  Instance configuration
   *              {String}   ^.name         Name of application
   *              {Integer}  ^.version      Version of application
   * @returns     {Object}                  The class instance
   */
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

/**
 * Underscore will contain Base helper methods
 */
Base.prototype._ = {};

/**
 * Traverses an object based on a string parsed in to a proper path
 * @param    *  {Object}  parameters  Method parameters
 *           *  {Object}  ^.target    Object to traverse
 *           *  {String}  ^.route     String route to parse
 * @returns     {Object}              The value of the object path
 */
Base.prototype._.dataRoute = function(parameters) {
  let route = "";
  let tokens = parameters.route.split(" ");
  tokens.forEach(token => {
    route = route + "[\"" + token + "\"]";
  });
  route = route.replace(/:([0-9])"/g, "\"][$1");
  return eval("parameters.target" + route);
}
