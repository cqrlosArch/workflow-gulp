const getData = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  const json = await res.json();
  return json;
  
};

export default getData