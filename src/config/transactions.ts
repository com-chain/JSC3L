

export default [
  // First Contract
  {
    setAccountParam: '848b2592:accAddress accStatus accType limitPlus limitMinus',
    pledgeAccount: '6c343eef:accAddress amount *',
    setAllowance: 'd4e12f2e:spenderAddress amount',
    setDelegation: '75741c79:spenderAddress limit',
    setTaxAmount: 'f6f1897d:amount',
    setTaxLegAmount: 'fafaf4c0:amount',
    setTaxAccount: 'd0385b5e:accAddress',
    setOwnerAccount: 'f2fde38b:accAddress',
    setContractStatus: '88b8084f:status',
  },
  // Second Contract
  {
    transferNant: 'a5f7c148:toAddress amount *',
    transferCM: '60ca9c4c:toAddress amount *',
    transferOnBehalfNant: '1b6b1ee5:fromAddress toAddress amount D',
    transferOnBehalfCM: '74c421fe:fromAddress toAddress amount D',
    askTransferFrom: '58258353:fromAddress amount',
    askTransferCMFrom: '2ef9ade2:fromAddress amount',
    payRequestNant: '132019f4:toAddress amount *',
    payRequestCM: '1415707c:toAddress amount *',
    rejectRequest: 'af98f757:toAddress',
    dismissAcceptedInfo: 'ccf93c7a:accAddress',
    dismissRejectedInfo: '88759215:accAddress',
  },
  // // Third Contract
  // {
  //   replaceAccount: '3e3fc7c7:newAddress',
  // }
]