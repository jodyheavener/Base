Base.Store = class extends Base.Class {

  constructor(configuration) {
    super.constructor(configuration);

    if (this.data === Object) {
      this.data = {};
    } else if (this.data === Array || typeof this.data == null) {
      this.data = [];
    }

    Object.observe(this.data, changeEvents => {
      changeEvents.forEach(change => {
        this.trigger(change.type, [ change ]);
      });
    });
  }

}

Base.prototype.addStore = function(configuration) {
  return new Base.Store(configuration);
}
