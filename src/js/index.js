import getData from './module';
import { Person } from './test';

getData().then((data) => console.log(data));

const persona = new Person('Juan', 'Madrid');
console.log(persona);
