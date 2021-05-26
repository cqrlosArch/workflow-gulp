(() => {
  // src/js/module.js
  var getData = async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const json = await res.json();
    return json;
  };
  var module_default = getData;

  // src/js/test.js
  console.log("test!!");
  var Person = class {
    constructor(name, city) {
      this.name = name;
      this.city = city;
    }
  };

  // src/js/index.js
  module_default().then((data) => console.log(data));
  var persona = new Person("Juan", "Madrid");
  console.log(persona);
})();
//# sourceMappingURL=bundle.js.map
