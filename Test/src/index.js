
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


window.getTransactionMemo = (wallet, transaction) => {
  let key = jsc3l.message.messageKeysFromCrypted(wallet, wallet.message_key.priv).clear_priv;
  let wallet_address = wallet.getAddressString().toLowerCase();

  if (transaction.addr_to.toLowerCase() == wallet_address &&
      transaction.message_to) {
    return jsc3l.message.decipherMessage(key, transaction.message_to);
  }

  if (transaction.addr_from.toLowerCase() == wallet_address &&
      transaction.message_from) {
    return jsc3l.message.decipherMessage(key, transaction.message_from);
  }

  return "";
};


