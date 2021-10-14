
window.jsc3l = require('@com-chain.org/jsc3l');

window.fetchUrl = url => {
  // TODO: use http
  return new Promise((resolve, reject) => {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.onreadystatechange = () => {
      if (xobj.readyState == 4 && xobj.status == "200") {
        resolve(xobj.responseText);
      }
    };
    xobj.send(null);
  });
};