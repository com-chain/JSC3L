
let jsc3l = require('@com-chain.org/jsc3l');

window.jsc3l = {
  connection: {
    ensureComChainRepo: jsc3l.jsc3l_connection.ensureComChainRepo,
    acquireEndPoint: jsc3l.jsc3l_connection.acquireEndPoint,
  },
  customization: {
    getConfJSON: jsc3l.jsc3l_customization.getConfJSON
  },
  message: {
    ensureWalletMessageKey: jsc3l.jsc3l_message.ensureWalletMessageKey,
    getMessageKey: jsc3l.jsc3l_message.getMessageKey,
    cipherMessage: jsc3l.jsc3l_message.cipherMessage,
  },
  ajaxReq: {
    getTransList: jsc3l.ajaxReq.getTransList,
  },
  bcRead: {
    getGlobalBalance: jsc3l.jsc3l_bcRead.getGlobalBalance,
  },
  bcTransaction: {
    TransfertNant: jsc3l.jsc3l_bcTransaction.TransfertNant,
  },
  Wallet: jsc3l.Wallet,
};


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
  let key = jsc3l.jsc3l_message.messageKeysFromCrypted(wallet, wallet.message_key.priv).clear_priv;
  let wallet_address = wallet.getAddressString().toLowerCase();

  if (transaction.addr_to.toLowerCase() == wallet_address &&
      transaction.message_to) {
    return jsc3l.jsc3l_message.decipherMessage(key, transaction.message_to);
  }

  if (transaction.addr_from.toLowerCase() == wallet_address &&
      transaction.message_from) {
    return jsc3l.jsc3l_message.decipherMessage(key, transaction.message_from);
  }

  return "";
};


