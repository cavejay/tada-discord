const p = require("./loggerFactory");

class Cacher {
  constructor(name, initialCache) {
    this.p = p(`Cacher|${name}`);
    this.cache = initialCache || {};
  }

  setCache(dict) {
    if (typeof dict !== "object") {
      this.p.error(`invalid cache: ${dict}`);
      throw "invalid cache was provided";
    }

    this.cache = {};
    Object.keys(dict).forEach(k => {
      this.cache[k] = Object.freeze(dict[k]);
    });

    return this;
  }

  check(key) {
    return this.cache[key] !== undefined;
  }

  get(key) {
    if (this.cache[key]) {
      return Object.freeze(this.cache[key]);
    } else {
      return undefined;
    }
  }

  keys() {
    return Object.freeze(Object.keys(this.cache));
  }

  values() {
    return Object.freeze(Object.values(this.cache));
  }

  set(key, value) {
    if (this.cache[key]) {
      p.warn(`Key already existed but will be replaced. Old value was: ${this.cache[key]}`);
    }
    this.cache[key] = Object.freeze(value);
    return value;
  }

  getOrSet(key, value) {
    if (this.cache[key]) {
      return this.get(key);
    } else {
      if (typeof value === "function") {
        return this.set(key, value());
      } else {
        return this.set(key, value);
      }
    }
  }
}

module.exports = Cacher;
