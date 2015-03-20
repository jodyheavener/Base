Base.Set = class extends Base.Class {

  constructor(configuration) {
    super.constructor(configuration);
  }

}

Base.prototype.addSet = function(configuration) {
  return new Base.Set(configuration);
}
